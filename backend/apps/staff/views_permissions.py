"""
Vues API pour la gestion des permissions dans Holly Pi.

Ce fichier contient les endpoints pour consulter et gérer
les permissions et rôles des employés.

Auteur : Benjamin DUSUNCELI CETIN
Créé : 08/12/2025
Version : 1.0
"""

from rest_framework import status, serializers
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema, inline_serializer

from apps.staff.employee_roles import (
    EmployeeRole,
    Permission,
    ROLE_PERMISSIONS,
    ROLE_HIERARCHY,
    get_role_permissions,
    get_roles_with_permission,
    is_higher_role
)
from apps.staff.permissions_utils import PermissionChecker
from apps.staff.permissions import IsAdminOrDirector


@extend_schema(
    operation_id='staff_permissions_roles_list',
    responses={
        200: inline_serializer(
            name='AllRolesResponse',
            fields={
                'roles': serializers.ListField(child=serializers.DictField()),
                'count': serializers.IntegerField(),
            },
        ),
    },
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_roles(request):
    """
    Retourne la liste de tous les rôles disponibles.
    
    GET /api/staff/permissions/roles/
    
    Returns:
        {
            "roles": [
                {
                    "name": "Super Admin Groupe",
                    "value": "Super Admin Groupe",
                    "hierarchy_level": 0
                },
                ...
            ]
        }
    """
    roles = [
        {
            "name": role.value,
            "value": role.value,
            "hierarchy_level": ROLE_HIERARCHY.index(role)
        }
        for role in EmployeeRole
    ]
    
    return Response({
        "roles": roles,
        "count": len(roles)
    })


@extend_schema(
    responses={
        200: inline_serializer(
            name='AllPermissionsResponse',
            fields={
                'permissions': serializers.ListField(child=serializers.DictField()),
                'count': serializers.IntegerField(),
            },
        ),
    },
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_permissions(request):
    """
    Retourne la liste de toutes les permissions disponibles.
    
    GET /api/staff/permissions/list/
    
    Returns:
        {
            "permissions": [
                {
                    "name": "view_all_establishments",
                    "value": "view_all_establishments"
                },
                ...
            ]
        }
    """
    permissions = [
        {
            "name": perm.value,
            "value": perm.value,
            "description": perm.value.replace('_', ' ').title()
        }
        for perm in Permission
    ]
    
    return Response({
        "permissions": permissions,
        "count": len(permissions)
    })


@extend_schema(
    responses={
        200: inline_serializer(
            name='RolePermissionsResponse',
            fields={
                'role': serializers.CharField(),
                'permissions': serializers.ListField(child=serializers.CharField()),
                'count': serializers.IntegerField(),
            },
        ),
        400: inline_serializer(name='RolePermissionsError', fields={'error': serializers.CharField()}),
    },
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_role_permissions_view(request, role_name):
    """
    Retourne les permissions d'un rôle spécifique.
    
    GET /api/staff/permissions/roles/{role_name}/permissions/
    
    Args:
        role_name: Le nom du rôle
    
    Returns:
        {
            "role": "Admin Établissement",
            "permissions": [
                "manage_establishment",
                "configure_establishment",
                ...
            ]
        }
    """
    try:
        role = EmployeeRole(role_name)
    except ValueError:
        return Response(
            {"error": f"Rôle invalide: {role_name}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    permissions = get_role_permissions(role)
    
    return Response({
        "role": role.value,
        "permissions": [perm.value for perm in permissions],
        "count": len(permissions)
    })


@extend_schema(
    operation_id='staff_permission_roles_by_name',
    responses={
        200: inline_serializer(
            name='PermissionRolesResponse',
            fields={
                'permission': serializers.CharField(),
                'roles': serializers.ListField(child=serializers.CharField()),
                'count': serializers.IntegerField(),
            },
        ),
        400: inline_serializer(name='PermissionRolesError', fields={'error': serializers.CharField()}),
    },
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_permission_roles_view(request, permission_name):
    """
    Retourne les rôles qui possèdent une permission spécifique.
    
    GET /api/staff/permissions/{permission_name}/roles/
    
    Args:
        permission_name: Le nom de la permission
    
    Returns:
        {
            "permission": "manage_staff",
            "roles": [
                "Super Admin Groupe",
                "Admin Établissement",
                ...
            ]
        }
    """
    try:
        permission = Permission(permission_name)
    except ValueError:
        return Response(
            {"error": f"Permission invalide: {permission_name}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    roles = get_roles_with_permission(permission)
    
    return Response({
        "permission": permission.value,
        "roles": [role.value for role in roles],
        "count": len(roles)
    })


@extend_schema(
    responses={
        200: inline_serializer(
            name='MyPermissionsResponse',
            fields={
                'user': serializers.DictField(),
                'employe': serializers.DictField(),
                'role': serializers.CharField(allow_null=True),
                'permissions': serializers.ListField(child=serializers.CharField()),
                'restaurants': serializers.ListField(child=serializers.DictField()),
                'permission_count': serializers.IntegerField(),
                'restaurant_count': serializers.IntegerField(),
            },
        ),
        404: inline_serializer(name='MyPermissionsNotFound', fields={'error': serializers.CharField()}),
        500: inline_serializer(name='MyPermissionsServerError', fields={'error': serializers.CharField(), 'detail': serializers.CharField()}),
    },
)
@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_my_permissions(request):
    """
    Retourne les permissions de l'utilisateur connecté.
    
    GET /api/staff/permissions/me/
    
    Returns:
        {
            "user": {
                "id": 1,
                "username": "test_user"
            },
            "employe": {
                "id": 1,
                "nom": "Dupont",
                "prenom": "Jean"
            },
            "role": "Manager Salle",
            "permissions": [
                "manage_service",
                "manage_reservations",
                ...
            ],
            "restaurants": [
                {
                    "id": 1,
                    "nom": "Les Ombres"
                }
            ]
        }
    """
    try:
        checker = PermissionChecker(user=request.user)
        
        if not checker.employe:
            return Response(
                {"error": "Aucun employé associé à cet utilisateur"},
                status=status.HTTP_404_NOT_FOUND
            )
        
        # Récupérer les restaurants
        restaurants = checker.get_restaurants()
        restaurants_data = [
            {
                "id": r.id_restaurant,
                "nom": r.nom_restaurant
            }
            for r in restaurants
        ]
        
        return Response({
            "user": {
                "id": request.user.id,
                "username": request.user.username,
                "email": request.user.email
            },
            "employe": {
                "id": checker.employe.id,
                "last_name": checker.employe.nom,
                "first_name": checker.employe.prenom
            },
            "role": checker.role.value if checker.role else None,
            "permissions": [perm.value for perm in checker.permissions],
            "restaurants": restaurants_data,
            "permission_count": len(checker.permissions),
            "restaurant_count": len(restaurants_data)
        })
    except Exception as e:
        return Response(
            {"error": "Erreur lors de la récupération des permissions", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    request=inline_serializer(
        name='CheckPermissionRequest',
        fields={'permission': serializers.CharField()},
    ),
    responses={
        200: inline_serializer(
            name='CheckPermissionResponse',
            fields={
                'has_permission': serializers.BooleanField(),
                'permission': serializers.CharField(),
                'role': serializers.CharField(allow_null=True),
            },
        ),
        400: inline_serializer(name='CheckPermissionError', fields={'error': serializers.CharField()}),
        500: inline_serializer(name='CheckPermissionServerError', fields={'error': serializers.CharField(), 'detail': serializers.CharField()}),
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_permission(request):
    """
    Vérifie si l'utilisateur connecté possède une permission.
    
    POST /api/staff/permissions/check/
    Body:
        {
            "permission": "manage_staff"
        }
    
    Returns:
        {
            "has_permission": true,
            "permission": "manage_staff",
            "role": "Admin Établissement"
        }
    """
    permission_name = request.data.get('permission')
    
    if not permission_name:
        return Response(
            {"error": "Paramètre 'permission' requis"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        permission = Permission(permission_name)
    except ValueError:
        return Response(
            {"error": f"Permission invalide: {permission_name}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        checker = PermissionChecker(user=request.user)
        has_perm = checker.has_permission(permission)
        
        return Response({
            "has_permission": has_perm,
            "permission": permission.value,
            "role": checker.role.value if checker.role else None
        })
    except Exception as e:
        return Response(
            {"error": "Erreur lors de la vérification", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    request=inline_serializer(
        name='CheckMultiplePermissionsRequest',
        fields={
            'permissions': serializers.ListField(child=serializers.CharField()),
            'require_all': serializers.BooleanField(required=False, default=False),
        },
    ),
    responses={
        200: inline_serializer(
            name='CheckMultiplePermissionsResponse',
            fields={
                'has_permissions': serializers.BooleanField(),
                'require_all': serializers.BooleanField(),
                'results': serializers.DictField(),
                'role': serializers.CharField(allow_null=True),
            },
        ),
        400: inline_serializer(name='CheckMultiplePermissionsError', fields={'error': serializers.CharField()}),
        500: inline_serializer(name='CheckMultiplePermissionsServerError', fields={'error': serializers.CharField(), 'detail': serializers.CharField()}),
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def check_multiple_permissions(request):
    """
    Vérifie si l'utilisateur possède plusieurs permissions.
    
    POST /api/staff/permissions/check-multiple/
    Body:
        {
            "permissions": ["manage_staff", "manage_service"],
            "require_all": false
        }
    
    Returns:
        {
            "has_permissions": true,
            "require_all": false,
            "results": {
                "manage_staff": true,
                "manage_service": false
            }
        }
    """
    permissions_names = request.data.get('permissions', [])
    require_all = request.data.get('require_all', False)
    
    if not permissions_names:
        return Response(
            {"error": "Paramètre 'permissions' requis (liste)"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        checker = PermissionChecker(user=request.user)
        
        # Vérifier chaque permission
        results = {}
        permissions = []
        
        for perm_name in permissions_names:
            try:
                perm = Permission(perm_name)
                permissions.append(perm)
                results[perm_name] = checker.has_permission(perm)
            except ValueError:
                results[perm_name] = False
        
        # Calculer le résultat global
        if require_all:
            has_permissions = all(results.values())
        else:
            has_permissions = any(results.values())
        
        return Response({
            "has_permissions": has_permissions,
            "require_all": require_all,
            "results": results,
            "role": checker.role.value if checker.role else None
        })
    except Exception as e:
        return Response(
            {"error": "Erreur lors de la vérification", "detail": str(e)},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@extend_schema(
    responses={
        200: inline_serializer(
            name='RoleHierarchyResponse',
            fields={
                'hierarchy': serializers.ListField(child=serializers.DictField()),
                'total_levels': serializers.IntegerField(),
            },
        ),
    },
)
@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def get_role_hierarchy(request):
    """
    Retourne la hiérarchie complète des rôles.
    Accessible uniquement aux administrateurs et directeurs.
    
    GET /api/staff/permissions/hierarchy/
    
    Returns:
        {
            "hierarchy": [
                {
                    "level": 0,
                    "role": "Super Admin Groupe",
                    "permissions_count": 25
                },
                ...
            ]
        }
    """
    hierarchy = []
    
    for level, role in enumerate(ROLE_HIERARCHY):
        permissions = get_role_permissions(role)
        hierarchy.append({
            "level": level,
            "role": role.value,
            "permissions_count": len(permissions)
        })
    
    return Response({
        "hierarchy": hierarchy,
        "total_levels": len(ROLE_HIERARCHY)
    })


@extend_schema(
    responses={
        200: inline_serializer(
            name='PermissionMatrixResponse',
            fields={
                'matrix': serializers.DictField(),
                'roles_count': serializers.IntegerField(),
                'total_permissions': serializers.IntegerField(),
            },
        ),
    },
)
@api_view(['GET'])
@permission_classes([IsAdminOrDirector])
def get_permission_matrix(request):
    """
    Retourne la matrice complète des permissions par rôle.
    Accessible uniquement aux administrateurs et directeurs.
    
    GET /api/staff/permissions/matrix/
    
    Returns:
        {
            "matrix": {
                "Super Admin Groupe": ["perm1", "perm2", ...],
                "Admin Établissement": ["perm1", "perm2", ...],
                ...
            }
        }
    """
    matrix = {}
    
    for role, permissions in ROLE_PERMISSIONS.items():
        matrix[role.value] = [perm.value for perm in permissions]
    
    return Response({
        "matrix": matrix,
        "roles_count": len(matrix),
        "total_permissions": len(Permission)
    })


@extend_schema(
    request=inline_serializer(
        name='CompareRolesRequest',
        fields={
            'role1': serializers.CharField(),
            'role2': serializers.CharField(),
        },
    ),
    responses={
        200: inline_serializer(
            name='CompareRolesResponse',
            fields={
                'role1': serializers.CharField(),
                'role2': serializers.CharField(),
                'role1_higher': serializers.BooleanField(),
                'role1_level': serializers.IntegerField(),
                'role2_level': serializers.IntegerField(),
                'hierarchy_difference': serializers.IntegerField(),
            },
        ),
        400: inline_serializer(name='CompareRolesError', fields={'error': serializers.CharField()}),
    },
)
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def compare_roles(request):
    """
    Compare deux rôles pour déterminer leur hiérarchie.
    
    POST /api/staff/permissions/compare-roles/
    Body:
        {
            "role1": "Admin Établissement",
            "role2": "Serveur"
        }
    
    Returns:
        {
            "role1": "Admin Établissement",
            "role2": "Serveur",
            "role1_higher": true,
            "hierarchy_difference": 8
        }
    """
    role1_name = request.data.get('role1')
    role2_name = request.data.get('role2')
    
    if not role1_name or not role2_name:
        return Response(
            {"error": "Paramètres 'role1' et 'role2' requis"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        role1 = EmployeeRole(role1_name)
        role2 = EmployeeRole(role2_name)
    except ValueError as e:
        return Response(
            {"error": f"Rôle invalide: {str(e)}"},
            status=status.HTTP_400_BAD_REQUEST
        )
    
    role1_higher = is_higher_role(role1, role2)
    level1 = ROLE_HIERARCHY.index(role1)
    level2 = ROLE_HIERARCHY.index(role2)
    
    return Response({
        "role1": role1.value,
        "role2": role2.value,
        "role1_higher": role1_higher,
        "role1_level": level1,
        "role2_level": level2,
        "hierarchy_difference": abs(level1 - level2)
    })

