from datetime import timedelta

from rest_framework import serializers
from apps.reservations.models import Reservation
from apps.salles.models import Salle, Table
from apps.salles.serializers import SalleSerializer, TableSerializer

class ReservationSerializer(serializers.HyperlinkedModelSerializer):
    client_name = serializers.CharField(source='nom_client', max_length=200)
    party_size = serializers.IntegerField(source='nombre_personnes')
    datetime = serializers.DateTimeField(source='date_heure')
    phone_number = serializers.CharField(source='telephone', max_length=20, required=False, allow_blank=True)
    salle = SalleSerializer(read_only=True)
    salle_id = serializers.PrimaryKeyRelatedField(queryset=Salle.objects.all(), source='salle')
    table = TableSerializer(read_only=True)
    table_id = serializers.PrimaryKeyRelatedField(
        queryset=Table.objects.all(), source='table', allow_null=True, required=False
    )

    class Meta:
        model = Reservation
        fields = ['id', 'client_name', 'party_size', 'datetime', 'phone_number', 'salle', 'salle_id', 'table', 'table_id']
        extra_kwargs = {
            'id': {'read_only': True}
        }

    def validate(self, data):
        salle = data.get('salle')
        if salle is None and self.instance:
            salle = self.instance.salle
        table = data.get('table')
        datetime_val = data.get('datetime') or data.get('date_heure')
        if datetime_val is None and self.instance:
            datetime_val = self.instance.date_heure
        party_size = data.get('party_size', data.get('nombre_personnes'))
        if party_size is None and self.instance:
            party_size = self.instance.nombre_personnes
        if party_size is not None and party_size <= 0:
            raise serializers.ValidationError({"non_field_errors": ["Le nombre de personnes doit être supérieur à zéro."]})
        if table is not None:
            if salle is None:
                salle = table.salle
            if salle is not None and table.salle_id != salle.id:
                raise serializers.ValidationError({
                    "table_id": [f"La table {table.id} n'appartient pas à la salle sélectionnée."]
                })
            if party_size is not None and party_size > table.capacity:
                raise serializers.ValidationError({
                    "non_field_errors": [f"Le nombre de personnes ({party_size}) dépasse la capacité de la table ({table.capacity})."]
                })
            slot_debut = datetime_val.replace(minute=0, second=0, microsecond=0) if datetime_val else None
            if slot_debut is not None:
                slot_fin = slot_debut + timedelta(hours=1)
                autre_resa_meme_table = Reservation.objects.filter(
                    table=table,
                    date_heure__gte=slot_debut,
                    date_heure__lt=slot_fin,
                )
                if self.instance:
                    autre_resa_meme_table = autre_resa_meme_table.exclude(id=self.instance.id)
                if autre_resa_meme_table.exists():
                    raise serializers.ValidationError({
                        "table_id": ["Cette table est déjà réservée à ce créneau horaire."]
                    })
        if salle and datetime_val and party_size is not None:
            if party_size > salle.capacite:
                raise serializers.ValidationError(
                    {"non_field_errors": [f"Le nombre de personnes ({party_size}) dépasse la capacité de la salle ({salle.capacite})."]}
                )
            slot_debut = datetime_val.replace(minute=0, second=0, microsecond=0)
            slot_fin = slot_debut + timedelta(hours=1)
            reservations_existantes = Reservation.objects.filter(
                salle=salle,
                date_heure__gte=slot_debut,
                date_heure__lt=slot_fin,
            )
            if self.instance:
                reservations_existantes = reservations_existantes.exclude(id=self.instance.id)
            total_personnes = sum(r.nombre_personnes for r in reservations_existantes)
            if total_personnes + party_size > salle.capacite:
                capacite_restante = max(0, salle.capacite - total_personnes)
                raise serializers.ValidationError({
                    "non_field_errors": [f"Impossible de réserver pour {party_size} personnes, il reste {capacite_restante} places disponibles à cet horaire."]
                })
        return data

    def create(self, validated_data):
        return Reservation.objects.create(
            nom_client=validated_data.get('client_name') or validated_data.get('nom_client', ''),
            nombre_personnes=validated_data.get('party_size') or validated_data.get('nombre_personnes'),
            date_heure=validated_data.get('datetime') or validated_data.get('date_heure'),
            telephone=validated_data.get('phone_number') or validated_data.get('telephone', ''),
            salle=validated_data.get('salle'),
            table=validated_data.get('table'),
        )

    def update(self, instance, validated_data):
        if 'client_name' in validated_data or 'nom_client' in validated_data:
            instance.nom_client = validated_data.get('client_name') or validated_data.get('nom_client')
        if 'party_size' in validated_data or 'nombre_personnes' in validated_data:
            instance.nombre_personnes = validated_data.get('party_size') or validated_data.get('nombre_personnes')
        if 'datetime' in validated_data or 'date_heure' in validated_data:
            instance.date_heure = validated_data.get('datetime') or validated_data.get('date_heure')
        if 'phone_number' in validated_data or 'telephone' in validated_data:
            instance.telephone = validated_data.get('phone_number') or validated_data.get('telephone')
        if 'salle' in validated_data:
            instance.salle = validated_data['salle']
        if 'table' in validated_data:
            instance.table = validated_data['table']
        instance.save()
        return instance
