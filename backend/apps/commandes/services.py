"""
Service layer pour la gestion des commandes.

Ce module centralise la logique métier liée aux commandes,
permettant de garder les modèles et vues plus légers.
"""

import logging
from decimal import Decimal
from typing import Optional, Dict, Any
from django.db import transaction

from apps.commandes.models import Commande, CommandeHistoric, LigneCommande
from apps.inventory.models import Stock
from apps.salles.models import Table

logger = logging.getLogger('apps.commandes')


class CommandeService:
    """
    Service pour la gestion des commandes.
    
    Centralise toute la logique métier liée aux commandes :
    - Calcul des totaux
    - Gestion des stocks
    - Archivage
    - Annulation
    """
    
    @staticmethod
    def calculer_totaux_commande(commande, use_cache: bool = True) -> Dict[str, Any]:
        """
        Calcule le montant total, le nombre d'articles et le CMV d'une commande.
        
        Args:
            commande: Instance de Commande
            use_cache: Utiliser le cache pour les stocks
            
        Returns:
            Dict contenant montant, nb_articles, cmv_total
        """
        if not commande.pk:
            return {
                'montant': Decimal('0'),
                'nb_articles': 0,
                'cmv_total': Decimal('0')
            }
        
        lignes = commande.lignes.select_related(
            'article',
            'article__categorie'
        ).prefetch_related(
            'article__ingredients',
            'article__ingredients__ingredient'
        )
        
        montant_total = Decimal('0')
        nb_articles_total = 0
        cmv_total = Decimal('0')
        
        # Récupérer tous les stocks nécessaires en une fois
        stocks_cache = None
        if use_cache and lignes:
            all_ingredient_ids = set()
            for ligne in lignes:
                for ai in ligne.article.ingredients.all():
                    all_ingredient_ids.add(ai.ingredient_id)
            
            if all_ingredient_ids:
                stocks_cache = Stock.get_stocks_cache(
                    restaurant_id=commande.restaurant_id,
                    ingredient_ids=list(all_ingredient_ids)
                )
        
        for ligne in lignes:
            montant_ligne = ligne.prix_unitaire * ligne.quantite
            montant_total += montant_ligne
            nb_articles_total += ligne.quantite
            
            if stocks_cache is not None:
                cmv_ligne = LigneCommandeService.calculer_cmv(
                    ligne, stocks_cache
                )
            else:
                cmv_ligne = ligne.cout_marchandise_vendue or Decimal('0')
            
            cmv_total += cmv_ligne
        
        return {
            'montant': montant_total,
            'nb_articles': nb_articles_total,
            'cmv_total': cmv_total
        }
    
    @staticmethod
    @transaction.atomic
    def annuler_commande(commande) -> bool:
        """
        Annule une commande et restaure les stocks.
        
        Args:
            commande: Instance de Commande
            
        Returns:
            True si l'annulation a réussi
        """
        if commande.statut == 'ANNULEE':
            logger.warning(f"Tentative d'annulation d'une commande déjà annulée: {commande.id}")
            return False
        
        # Restaurer les stocks
        StockService.restaurer_stocks_commande(commande)
        
        # Mettre à jour le statut
        commande.statut = 'ANNULEE'
        commande.cout_total_marchandises_vendues = Decimal('0')
        commande.save(update_fields=['statut', 'cout_total_marchandises_vendues'])
        
        # Libérer la table si nécessaire
        if commande.table:
            commande.table.is_occupied = False
            commande.table.save(update_fields=['is_occupied'])
        
        logger.info(f"Commande {commande.id} annulée avec succès")
        return True
    
    @staticmethod
    @transaction.atomic
    def archiver_commande(commande) -> Optional['CommandeHistoric']:
        """
        Archive une commande validée ou annulée.
        
        Args:
            commande: Instance de Commande
            
        Returns:
            Instance de CommandeHistoric créée
        """
        from .models import CommandeHistoric, LigneCommandeHistoric
        
        if commande.statut not in ['VALIDEE', 'ANNULEE']:
            logger.warning(
                f"Tentative d'archivage d'une commande non finalisée: {commande.id}"
            )
            return None
        
        # Créer l'entrée historique
        historic = CommandeHistoric.objects.create(
            nb_articles=commande.nb_articles,
            montant=commande.montant,
            created_at=commande.created_at,
            created_by=commande.created_by,
            restaurant=commande.restaurant,
            statut=commande.statut,
            table=commande.table,
            cout_total_marchandises_vendues=commande.cout_total_marchandises_vendues
        )
        
        # Copier les lignes
        for ligne in commande.lignes.all():
            LigneCommandeHistoric.objects.create(
                commande=historic,
                article=ligne.article,
                quantite=ligne.quantite,
                prix_unitaire=ligne.prix_unitaire,
                cout_marchandise_vendue=ligne.cout_marchandise_vendue
            )
        
        # Supprimer la commande originale
        commande.delete()
        
        logger.info(f"Commande {historic.id} archivée avec succès")
        return historic
    
    @staticmethod
    def valider_commande(commande) -> bool:
        """
        Valide une commande et l'archive.
        
        Args:
            commande: Instance de Commande
            
        Returns:
            True si la validation a réussi
        """
        if commande.statut != 'EN_COURS':
            logger.warning(
                f"Tentative de validation d'une commande non en cours: {commande.id}"
            )
            return False
        
        commande.statut = 'VALIDEE'
        commande.save(update_fields=['statut'])
        
        # Libérer la table
        if commande.table:
            commande.table.is_occupied = False
            commande.table.save(update_fields=['is_occupied'])
        
        # Archiver
        CommandeService.archiver_commande(commande)
        
        logger.info(f"Commande {commande.id} validée avec succès")
        return True

    @staticmethod
    def deplacer_commande_vers_table(commande, table) -> None:
        """
        Déplace une commande vers une autre table.
        Lève ValueError si la table cible a déjà une commande EN_COURS (table occupée).

        Args:
            commande: Instance de Commande (statut EN_COURS)
            table: Instance de Table cible

        Raises:
            ValueError: Si la table est déjà occupée par une autre commande
        """
        if commande.statut != 'EN_COURS':
            raise ValueError("Seule une commande en cours peut être déplacée.")
        if table is None:
            raise ValueError("La table cible est requise.")
        autre_commande = Commande.objects.filter(
            table=table, statut='EN_COURS'
        ).exclude(pk=commande.pk).exists()
        if autre_commande:
            raise ValueError("La table est occupée.")
        commande.table = table
        commande.save(update_fields=['table'])


class LigneCommandeService:
    """
    Service pour la gestion des lignes de commande.
    """
    
    @staticmethod
    def calculer_cmv(ligne, stocks_cache: Optional[Dict] = None) -> Decimal:
        """
        Calcule le CMV pour une ligne de commande.
        
        Args:
            ligne: Instance de LigneCommande
            stocks_cache: Cache des stocks {ingredient_id: stock_data}
            
        Returns:
            CMV calculé
        """
        if not ligne.article_id or not ligne.commande_id:
            return Decimal('0')
        
        cmv_total = Decimal('0')
        restaurant = ligne.commande.restaurant
        
        # Construire le cache si non fourni
        if stocks_cache is None:
            ingredient_ids = [
                ai.ingredient_id 
                for ai in ligne.article.ingredients.all()
            ]
            stocks = Stock.objects.filter(
                restaurant=restaurant,
                ingredient_id__in=ingredient_ids
            ).select_related('ingredient')
            stocks_cache = {stock.ingredient_id: stock for stock in stocks}
        
        for article_ingredient in ligne.article.ingredients.all():
            stock_data = stocks_cache.get(article_ingredient.ingredient_id)
            
            if stock_data:
                if isinstance(stock_data, dict):
                    cout_unitaire = Decimal(str(stock_data['cout_moyen_pondere']))
                else:
                    cout_unitaire = stock_data.cout_moyen_pondere
            else:
                # Fallback sur le prix unitaire de l'ingrédient
                cout_unitaire = article_ingredient.ingredient.prix_unitaire or Decimal('0')
            
            cmv_ingredient = article_ingredient.quantite_necessaire * cout_unitaire
            cmv_total += cmv_ingredient
        
        return cmv_total * ligne.quantite
    
    @staticmethod
    @transaction.atomic
    def deduire_stocks(ligne) -> None:
        """
        Déduit les stocks pour une ligne de commande.
        
        Args:
            ligne: Instance de LigneCommande
        """
        if ligne.commande.statut == 'ANNULEE':
            return
        
        restaurant = ligne.commande.restaurant
        
        for article_ingredient in ligne.article.ingredients.all():
            try:
                stock = Stock.objects.select_for_update().get(
                    restaurant=restaurant,
                    ingredient=article_ingredient.ingredient
                )
                quantite_deduite = article_ingredient.quantite_necessaire * ligne.quantite
                stock.quantite_en_stock -= quantite_deduite
                stock.save(update_fields=['quantite_en_stock'])
                
                logger.debug(
                    f"Stock déduit: {quantite_deduite} {article_ingredient.ingredient.unite} "
                    f"de {article_ingredient.ingredient.nom}"
                )
            except Stock.DoesNotExist:
                logger.warning(
                    f"Stock inexistant pour l'ingrédient {article_ingredient.ingredient.nom} "
                    f"dans le restaurant {restaurant.nom_restaurant}"
                )

    @staticmethod
    def commande_en_cours_pour_table(table_id: int):
        """
        Retourne la commande EN_COURS associée à la table, ou None si aucune.

        Args:
            table_id: ID de la table

        Returns:
            Commande ou None
        """
        return Commande.objects.filter(
            table_id=table_id, statut='EN_COURS'
        ).first()

    @staticmethod
    @transaction.atomic
    def deplacer_ligne_vers_commande(ligne, commande_cible) -> None:
        """
        Déplace une ligne de commande vers une autre commande (d'une table à une autre).
        Les stocks ne sont pas modifiés (déjà déduits à la création de la ligne).
        Recalcule les totaux des deux commandes (source et cible).

        Args:
            ligne: Instance de LigneCommande
            commande_cible: Instance de Commande cible (doit être EN_COURS, même restaurant)

        Raises:
            ValueError: Si la commande cible n'existe pas, n'est pas EN_COURS,
                        ou n'est pas du même restaurant
        """
        if not commande_cible or commande_cible.statut != 'EN_COURS':
            raise ValueError("La commande cible doit exister et être en cours.")
        if commande_cible.restaurant_id != ligne.commande.restaurant_id:
            raise ValueError("La commande cible doit être du même restaurant.")
        if ligne.commande_id == commande_cible.pk:
            raise ValueError("La ligne appartient déjà à cette commande.")
        commande_source = ligne.commande
        LigneCommande.objects.filter(pk=ligne.pk).update(commande_id=commande_cible.pk)
        for cmd in (commande_source, commande_cible):
            cmd.calculer_montant_et_cmv()
            cmd.save(update_fields=['montant', 'nb_articles', 'cout_total_marchandises_vendues'])


class StockService:
    """
    Service pour la gestion des stocks.
    """
    
    @staticmethod
    @transaction.atomic
    def restaurer_stocks_commande(commande) -> None:
        """
        Restaure les stocks pour toutes les lignes d'une commande.
        
        Args:
            commande: Instance de Commande
        """
        restaurant = commande.restaurant
        
        for ligne in commande.lignes.all():
            for article_ingredient in ligne.article.ingredients.all():
                try:
                    stock = Stock.objects.select_for_update().get(
                        restaurant=restaurant,
                        ingredient=article_ingredient.ingredient
                    )
                    quantite_restauree = article_ingredient.quantite_necessaire * ligne.quantite
                    stock.quantite_en_stock += quantite_restauree
                    stock.save(update_fields=['quantite_en_stock'])
                    
                    logger.debug(
                        f"Stock restauré: {quantite_restauree} {article_ingredient.ingredient.unite} "
                        f"de {article_ingredient.ingredient.nom}"
                    )
                except Stock.DoesNotExist:
                    logger.warning(
                        f"Stock inexistant pour l'ingrédient {article_ingredient.ingredient.nom}"
                    )
    
    @staticmethod
    @transaction.atomic
    def restaurer_stocks_ligne(ligne) -> None:
        """
        Restaure les stocks pour une ligne de commande supprimée.
        
        Args:
            ligne: Instance de LigneCommande
        """
        if not ligne.commande or ligne.commande.statut == 'ANNULEE':
            return
        
        restaurant = ligne.commande.restaurant
        
        for article_ingredient in ligne.article.ingredients.all():
            try:
                stock = Stock.objects.select_for_update().get(
                    restaurant=restaurant,
                    ingredient=article_ingredient.ingredient
                )
                quantite_restauree = article_ingredient.quantite_necessaire * ligne.quantite
                stock.quantite_en_stock += quantite_restauree
                stock.save(update_fields=['quantite_en_stock'])
            except Stock.DoesNotExist:
                pass

