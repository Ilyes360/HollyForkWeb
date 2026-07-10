# Holly Pi API (HolyForkWeb)

- **Version** : `1.0.0`
- **Spécification** : OAS 3.0
- **Schéma OpenAPI** : `/api/schema/`
- **Authentification** : JWT (Bearer)

> Documentation OpenAPI 3 – authentification JWT (Bearer).

---

## Sommaire

1. [article-ingredients](#article-ingredients)
2. [articles](#articles)
3. [auth](#auth)
4. [categories](#categories)
5. [commandes](#commandes)
6. [dashboard](#dashboard)
7. [employees](#employees)
8. [employes](#employes)
9. [factures](#factures)
10. [ingredients](#ingredients)
11. [lignes-commandes](#lignes-commandes)
12. [methodes-paiement](#methodes-paiement)
13. [notes](#notes)
14. [paiements](#paiements)
15. [planning](#planning)
16. [reapprovisionnements](#reapprovisionnements)
17. [reports](#reports)
18. [reservations](#reservations)
19. [restaurant-employes](#restaurant-employes)
20. [restaurants](#restaurants)
21. [salles](#salles)
22. [settings](#settings)
23. [staff](#staff)
24. [stocks](#stocks)
25. [suppliers](#suppliers)
26. [tables](#tables)
27. [type-employes](#type-employes)
28. [csrf](#csrf)
29. [Schemas](#schemas)

---

## article-ingredients

### `GET /api/article-ingredients/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `article_id` | query | integer | article_id |
| `ingredient_id` | query | integer | ingredient_id |
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-2.66",
        "description": "string",
        "available": true
      },
      "ingredient": {
        "id": 0,
        "name": "string",
        "unit": "string",
        "unit_price": "9751255.52"
      },
      "required_quantity": "-68",
      "article_id": 0,
      "ingredient_id": 0
    }
  ]
}
```

---

### `POST /api/article-ingredients/`

#### Request body — `application/json`

```json
{
  "required_quantity": "-33",
  "article_id": 0,
  "ingredient_id": 0
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "-50408740",
    "description": "string",
    "available": true
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "-45271"
  },
  "required_quantity": "-.2",
  "article_id": 0,
  "ingredient_id": 0
}
```

---

### `GET /api/article-ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLE_INGREDIENT. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "-315",
    "description": "string",
    "available": true
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "70722221.4"
  },
  "required_quantity": "77345",
  "article_id": 0,
  "ingredient_id": 0
}
```

---

### `PUT /api/article-ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLE_INGREDIENT. |

#### Request body — `application/json`

```json
{
  "required_quantity": "-14124.",
  "article_id": 0,
  "ingredient_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "222.2",
    "description": "string",
    "available": true
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "4788002"
  },
  "required_quantity": "-14942.3",
  "article_id": 0,
  "ingredient_id": 0
}
```

---

### `PATCH /api/article-ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLE_INGREDIENT. |

#### Request body — `application/json`

```json
{
  "required_quantity": "-82094.691",
  "article_id": 0,
  "ingredient_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "8.5",
    "description": "string",
    "available": true
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": ""
  },
  "required_quantity": "7146",
  "article_id": 0,
  "ingredient_id": 0
}
```

---

### `DELETE /api/article-ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLE_INGREDIENT. |

#### Responses

**204** — No response body

---

## articles

### `GET /api/articles/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `disponible` | query | boolean | -- |
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "name": "string",
      "categorie": {
        "id": 0,
        "name": "string",
        "display_order": 0,
        "description": "string"
      },
      "price": "-040",
      "description": "string",
      "available": true,
      "ingredients": [
        {
          "id": 0,
          "article": {
            "id": 0,
            "name": "string",
            "categorie": {
              "id": 0,
              "name": "string",
              "display_order": 0,
              "description": "string"
            },
            "price": "005",
            "description": "string",
            "available": true
          },
          "ingredient": {
            "id": 0,
            "name": "string",
            "unit": "string",
            "unit_price": "-8191535"
          },
          "required_quantity": "856",
          "article_id": 0,
          "ingredient_id": 0
        }
      ]
    }
  ]
}
```

---

### `POST /api/articles/`

#### Request body — `application/json`

```json
{
  "name": "string",
  "restaurant_id": 0,
  "categorie_id": 0,
  "price": "87399908.5",
  "description": "string",
  "ingredients_update": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ]
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "categorie": {
    "id": 0,
    "name": "string",
    "display_order": 0,
    "description": "string"
  },
  "price": "1.2",
  "description": "string",
  "available": true,
  "ingredients": [
    {
      "id": 0,
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "41100.33",
        "description": "string",
        "available": true
      },
      "ingredient": {
        "id": 0,
        "name": "string",
        "unit": "string",
        "unit_price": "634659.36"
      },
      "required_quantity": "-156269",
      "article_id": 0,
      "ingredient_id": 0
    }
  ]
}
```

---

### `GET /api/articles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLES. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "categorie": {
    "id": 0,
    "name": "string",
    "display_order": 0,
    "description": "string"
  },
  "price": "-0024054.5",
  "description": "string",
  "available": true,
  "ingredients": [
    {
      "id": 0,
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-744.",
        "description": "string",
        "available": true
      },
      "ingredient": {
        "id": 0,
        "name": "string",
        "unit": "string",
        "unit_price": "9"
      },
      "required_quantity": "4",
      "article_id": 0,
      "ingredient_id": 0
    }
  ]
}
```

---

### `PUT /api/articles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLES. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "restaurant_id": 0,
  "categorie_id": 0,
  "price": "-56378943",
  "description": "string",
  "ingredients_update": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ]
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "categorie": {
    "id": 0,
    "name": "string",
    "display_order": 0,
    "description": "string"
  },
  "price": "4.39",
  "description": "string",
  "available": true,
  "ingredients": [
    {
      "id": 0,
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "5528225",
        "description": "string",
        "available": true
      },
      "ingredient": {
        "id": 0,
        "name": "string",
        "unit": "string",
        "unit_price": "-40"
      },
      "required_quantity": "4668.",
      "article_id": 0,
      "ingredient_id": 0
    }
  ]
}
```

---

### `PATCH /api/articles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLES. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "restaurant_id": 0,
  "categorie_id": 0,
  "price": "5459",
  "description": "string",
  "ingredients_update": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ]
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "categorie": {
    "id": 0,
    "name": "string",
    "display_order": 0,
    "description": "string"
  },
  "price": "2008",
  "description": "string",
  "available": true,
  "ingredients": [
    {
      "id": 0,
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "406.4",
        "description": "string",
        "available": true
      },
      "ingredient": {
        "id": 0,
        "name": "string",
        "unit": "string",
        "unit_price": "3322"
      },
      "required_quantity": "-71013.35",
      "article_id": 0,
      "ingredient_id": 0
    }
  ]
}
```

---

### `DELETE /api/articles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_ARTICLES. |

#### Responses

**204** — No response body

---

## auth

### `GET /api/auth/csrf-token/`

> Récupération du token CSRF. Aucune authentification utilisateur requise.

#### Responses

**200** — `application/json`

```json
{
  "csrfToken": "string"
}
```

---

### `POST /api/auth/delete-account/`

> Supprime le compte de l'utilisateur connecté. Requiert authentification (header `Authorization: Token <token>` ou `Bearer <token>`).

#### Responses

**200** — `application/json`

```json
{
  "message": "string"
}
```

**401** — `application/json`

```json
{
  "detail": "string"
}
```

---

### `POST /api/auth/device-login/`

> Connexion d'un équipement (iPad) au restaurant. Première étape : ID Restaurant + PIN Restaurant → Device Token. Aucune authentification utilisateur requise.

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "pin_restaurant": "923113"
}
```

#### Responses

**200** — `application/json`

```json
{
  "message": "string",
  "device_token": "string",
  "restaurant_id": 0,
  "restaurant_name": "string",
  "restaurant_ville": "string",
  "next_step": "string"
}
```

**400** — `application/json`

```json
{
  "detail": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `GET /api/auth/health/`

> Endpoint de health check simple pour le monitoring. Ne nécessite pas d'authentification et renvoie toujours 200 par défaut.

#### Responses

**200** — `application/json`

```json
{
  "status": "string"
}
```

---

### `POST /api/auth/login/`

> Login par email + mot de passe. Si MFA est activé, la réponse contient `requires_mfa=true` et `temp_token` ; envoyer ensuite `temp_token` + code TOTP à `POST /api/auth/verify-mfa/` pour obtenir les tokens. Envoyer le JWT dans le header `Authorization: Token <access_token>` ou `Authorization: Bearer <access_token>`.

#### Request body — `application/json`

```json
{
  "email": "user@example.com",
  "password": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "message": "string",
  "access_token": "string",
  "token": "string",
  "refresh_token": "string",
  "requires_mfa": true,
  "temp_token": "string",
  "user_id": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "employee_id": 0,
  "employee_name": "string",
  "employee_first_name": "string",
  "employee_last_name": "string",
  "employee_type": "string",
  "employee_type_id": 0,
  "restaurant_id": 0,
  "restaurant_name": "string"
}
```

**400** — `application/json`

```json
{
  "detail": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `POST /api/auth/logout/`

> Déconnexion. POST sans body.

#### Responses

**200** — `application/json`

```json
{
  "message": "string"
}
```

---

### `POST /api/auth/mfa/confirm/`

> Vérifie le code TOTP et active le MFA pour l'utilisateur. Appeler `mfa/setup` avant pour obtenir le QR / secret.

#### Request body — `application/json`

```json
{
  "code": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "detail": "string"
}
```

**400** — `application/json`

```json
{
  "detail": "string"
}
```

---

### `POST /api/auth/mfa/disable/`

> Désactive le MFA. Corps : `password` (pour confirmer).

#### Request body — `application/json`

```json
{
  "password": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "detail": "string"
}
```

**401** — `application/json`

```json
{
  "detail": "string"
}
```

---

### `POST /api/auth/mfa/setup/`

> Génère un secret TOTP et l'URL `otpauth` (QR code). N'active pas le MFA tant que `mfa/confirm` n'est pas appelé avec un code valide.

#### Responses

**200** — `application/json`

```json
{
  "secret": "string",
  "otpauth_url": "string"
}
```

**400** — `application/json`

```json
{
  "detail": "string"
}
```

---

### `GET /api/auth/mfa/status/`

> Indique si le MFA est activé pour l'utilisateur connecté.

#### Responses

**200** — `application/json`

```json
{
  "mfa_enabled": true
}
```

---

### `GET /api/auth/profile/`

> Récupérer le profil de l'utilisateur connecté.

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "date_joined": "2026-05-05T12:21:22.622Z",
  "is_active": true,
  "mfa_enabled": true
}
```

---

### `PATCH /api/auth/profile/`

> Mettre à jour partiellement le profil de l'utilisateur.

#### Request body — `application/json`

```json
{
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "message": "string",
  "user": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

**400** — `application/json`

```json
{
  "detail": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `DELETE /api/auth/profile/`

> Supprimer le compte de l'utilisateur connecté.

#### Responses

**200** — `application/json`

```json
{
  "message": "string"
}
```

---

### `POST /api/auth/quick-login/`

> Connexion rapide d'un employé avec son PIN. Utilise le `device_token` (restaurant déjà configuré) + PIN employé. Aucune authentification utilisateur requise.

#### Request body — `application/json`

```json
{
  "device_token": "string",
  "pin_code": "3991"
}
```

#### Responses

**200** — `application/json`

```json
{
  "message": "string",
  "access_token": "string",
  "refresh_token": "string",
  "user_id": 0,
  "username": "string",
  "employee_id": 0,
  "employee_name": "string",
  "employee_first_name": "string",
  "employee_last_name": "string",
  "employee_type": "string",
  "employee_type_id": 0,
  "restaurant_id": 0,
  "restaurant_name": "string"
}
```

**400** — `application/json`

```json
{
  "detail": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `POST /api/auth/register/`

> Inscription d'un nouvel utilisateur avec création d'employé. Aucune authentification utilisateur requise.

#### Request body — `application/json`

```json
{
  "username": "z6N8XWPxRb5lrtyJ8kzgDKwhSE-JtGtT.tfckraMJHhhh+aepqQH4_.AYCDiYr_v",
  "email": "user@example.com",
  "password": "string",
  "password2": "string",
  "first_name": "string",
  "last_name": "string",
  "employee_first_name": "string",
  "employee_last_name": "string",
  "pin_code": "4895",
  "type_employe_id": 0,
  "restaurant_id": 0
}
```

#### Responses

**201** — `application/json`

```json
{
  "message": "string",
  "id_user": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "verification_token": "string",
  "next_step": "string",
  "employee_id": 0,
  "employee_name": "string",
  "employee_first_name": "string",
  "employee_last_name": "string",
  "employee_type": "string",
  "employee_type_id": 0
}
```

**400** — `application/json`

```json
{
  "detail": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `GET /api/auth/restaurant-employees/`

> Récupère la liste des employés d'un restaurant après connexion device. Utilise le `device_token` pour identifier le restaurant. Aucune authentification utilisateur requise.

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `device_token` | query | string | ✅ | Token équipement |

#### Responses

**200** — `application/json`

```json
{
  "restaurant_id": 0,
  "restaurant_name": "string",
  "employees": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ],
  "total": 0
}
```

**400** — `application/json`

```json
{
  "error": "string"
}
```

**401** — `application/json`

```json
{
  "error": "string"
}
```

---

### `POST /api/auth/token/refresh/`

> Takes a refresh type JSON web token and returns an access type JSON web token if the refresh token is valid.

#### Request body — `application/json`

```json
{
  "refresh": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "access": "string"
}
```

---

### `POST /api/auth/verify-mfa/`

> Vérification du code TOTP après un login avec MFA. Corps : `temp_token` (reçu au login), `code` (6 chiffres). Retourne les tokens JWT en cas de succès.

#### Request body — `application/json`

```json
{
  "temp_token": "string",
  "code": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "message": "string",
  "access_token": "string",
  "token": "string",
  "refresh_token": "string",
  "user_id": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string"
}
```

**400** — `application/json`

```json
{
  "detail": "string"
}
```

**401** — `application/json`

```json
{
  "detail": "string"
}
```

---

## categories

> API endpoint pour gérer les catégories d'articles.

### `GET /api/categories/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `nom` | query | string | nom |
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    }
  ]
}
```

---

### `POST /api/categories/`

#### Request body — `application/json`

```json
{
  "name": "string",
  "display_order": 0,
  "description": "string"
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "display_order": 0,
  "description": "string"
}
```

---

### `GET /api/categories/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_CATEGORIES_ARTICLE. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "display_order": 0,
  "description": "string"
}
```

---

### `PUT /api/categories/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_CATEGORIES_ARTICLE. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "display_order": 0,
  "description": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "display_order": 0,
  "description": "string"
}
```

---

### `PATCH /api/categories/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_CATEGORIES_ARTICLE. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "display_order": 0,
  "description": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "display_order": 0,
  "description": "string"
}
```

---

### `DELETE /api/categories/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_CATEGORIES_ARTICLE. |

#### Responses

**204** — No response body

---

## commandes

### `GET /api/commandes/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `created_by_id` | query | integer | created_by_id |
| `page` | query | integer | A page number within the paginated result set. |
| `restaurant_id` | query | integer | restaurant_id |
| `statut` | query | string | `EN_COURS` (En cours), `VALIDEE` (Validée), `ANNULEE` (Annulée). Available values : `ANNULEE`, `EN_COURS`, `VALIDEE` |
| `table_id` | query | integer | table_id |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "items_count": 0,
      "amount": "9.23",
      "created_at": "2026-05-05T12:21:22.701Z",
      "created_by": {
        "id": 0,
        "user": {
          "id": 0,
          "username": "string",
          "email": "user@example.com",
          "first_name": "string",
          "last_name": "string"
        },
        "last_name": "string",
        "first_name": "string",
        "type_employe": {
          "id": 0,
          "type_name": "string",
          "description": "string"
        },
        "salary": "0.00",
        "hire_date": "2026-05-05",
        "phone_number": "string"
      },
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "56910245633547",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "status": "string",
      "kitchen_status": "string",
      "priority": "string",
      "created_by_id": 0,
      "restaurant_id": 0,
      "lignes": [
        {
          "id": 0,
          "commande": "string",
          "article": {
            "id": 0,
            "name": "string",
            "categorie": {
              "id": 0,
              "name": "string",
              "display_order": 0,
              "description": "string"
            },
            "price": "42",
            "description": "string",
            "available": true,
            "ingredients": [
              {
                "id": 0,
                "article": {
                  "id": 0,
                  "name": "string",
                  "categorie": {
                    "id": 0,
                    "name": "string",
                    "display_order": 0,
                    "description": "string"
                  },
                  "price": ".6",
                  "description": "string",
                  "available": true
                },
                "ingredient": {
                  "id": 0,
                  "name": "string",
                  "unit": "string",
                  "unit_price": "-8796"
                },
                "required_quantity": "-.158",
                "article_id": 0,
                "ingredient_id": 0
              }
            ]
          },
          "quantity": 0,
          "unit_price": "-4925.4",
          "article_id": 0,
          "cost_of_goods_sold": "4.7",
          "awaiting_service": true
        }
      ],
      "table": {
        "id": 0,
        "numero": 1,
        "capacity": 9223372036854776000,
        "reserved_seats": 9223372036854776000,
        "is_occupied": true,
        "salle": {
          "id": 0,
          "name": "string",
          "restaurant": {
            "restaurant_id": 0,
            "name": "string",
            "address": "string",
            "postal_code": "string",
            "city": "string",
            "phone_number": "string",
            "siret": "61868036672394",
            "naf_code": "string",
            "pin": "string",
            "logo_url": "string"
          },
          "capacity": 0,
          "floor": 0,
          "description": "string"
        },
        "employee_in_charge": {
          "id": 0,
          "user": {
            "id": 0,
            "username": "string",
            "email": "user@example.com",
            "first_name": "string",
            "last_name": "string"
          },
          "last_name": "string",
          "first_name": "string",
          "type_employe": {
            "id": 0,
            "type_name": "string",
            "description": "string"
          },
          "salary": "0.00",
          "hire_date": "2026-05-05",
          "phone_number": "string"
        },
        "salle_id": 0,
        "employee_in_charge_id": 0,
        "position_x": 9223372036854776000,
        "position_y": 9223372036854776000
      },
      "table_id": 0,
      "total_cost_of_goods_sold": "574",
      "is_in_progress": true
    }
  ]
}
```

---

### `POST /api/commandes/`

#### Request body — `application/json`

```json
{
  "created_at": "2026-05-05T12:21:19.598Z",
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "table_id": 0
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "-9",
  "created_at": "2026-05-05T12:21:22.709Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "94425300415348",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-617.",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "582280.",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "-179972"
            },
            "required_quantity": "-143862",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "1755",
      "article_id": 0,
      "cost_of_goods_sold": "-.1",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "83783766939694",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "-5",
  "is_in_progress": true
}
```

---

### `GET /api/commandes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "632000",
  "created_at": "2026-05-05T12:21:22.714Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "72891074323093",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "85.05",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "-860",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "-389"
            },
            "required_quantity": ".",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "-.",
      "article_id": 0,
      "cost_of_goods_sold": "723562",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "36610090544511",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "2998",
  "is_in_progress": true
}
```

---

### `PUT /api/commandes/{id}/`

> Surcharge pour gérer l'archivage automatique des commandes. Quand une commande passe en statut `VALIDEE` ou `ANNULEE`, elle est archivée dans `CommandeHistoric` et supprimée de la table `Commande`.

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Request body — `application/json`

```json
{
  "created_at": "2026-05-05T12:21:19.610Z",
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "table_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "06",
  "created_at": "2026-05-05T12:21:22.723Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "50364043982981",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "40",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "-"
            },
            "required_quantity": ".52",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "-4770649",
      "article_id": 0,
      "cost_of_goods_sold": "1440.12",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "99057862523962",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "-3",
  "is_in_progress": true
}
```

---

### `PATCH /api/commandes/{id}/`

> PATCH utilise la même logique que PUT.

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Request body — `application/json`

```json
{
  "created_at": "2026-05-05T12:21:19.619Z",
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "table_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "-37188656",
  "created_at": "2026-05-05T12:21:22.732Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "86808826813000",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "973222.0",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "8.",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "-9968"
            },
            "required_quantity": "-",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "894418.88",
      "article_id": 0,
      "cost_of_goods_sold": "9",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "19025913348917",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "12.",
  "is_in_progress": true
}
```

---

### `DELETE /api/commandes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Responses

**204** — No response body

---

### `POST /api/commandes/{id}/annuler/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Request body — `application/json`

```json
{
  "created_at": "2026-05-05T12:21:19.629Z",
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "table_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "-22395060.70",
  "created_at": "2026-05-05T12:21:22.746Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "41155852042216",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "624",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "-3.57",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "-230."
            },
            "required_quantity": "-04946.3880",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "0876",
      "article_id": 0,
      "cost_of_goods_sold": "-7986",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "76736366062313",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "-64.8",
  "is_in_progress": true
}
```

---

### `POST /api/commandes/{id}/deplacer/`

> Déplace la commande vers une autre table.
> **Body** : `{"table_id": <int>}`
> Retourne `400` avec `"La table est occupée."` si une commande `EN_COURS` existe déjà sur cette table.

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Request body — `application/json`

```json
{
  "created_at": "2026-05-05T12:21:19.638Z",
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "table_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "0.",
  "created_at": "2026-05-05T12:21:22.755Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "73059021481895",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "-.7",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "79"
            },
            "required_quantity": "279",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "",
      "article_id": 0,
      "cost_of_goods_sold": "-8.37",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "63567789390441",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "0",
  "is_in_progress": true
}
```

---

### `POST /api/commandes/{id}/kitchen/print/`

> Endpoint pour imprimer un ticket de cuisine (optionnel).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Request body — `application/json`

```json
{
  "created_at": "2026-05-05T12:21:19.647Z",
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "table_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "923685.",
  "created_at": "2026-05-05T12:21:22.764Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "37558723332705",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-363.0",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "43",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "-837.28"
            },
            "required_quantity": "06.",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "-7715.",
      "article_id": 0,
      "cost_of_goods_sold": "6",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "25966912252414",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "-4080.13",
  "is_in_progress": true
}
```

---

### `PATCH /api/commandes/{id}/kitchen/update-status/`

> Met à jour le statut cuisine et/ou la priorité d'une commande.

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_COMMANDES. |

#### Request body — `application/json`

```json
{
  "created_at": "2026-05-05T12:21:19.655Z",
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "table_id": 0
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "46920947",
  "created_at": "2026-05-05T12:21:22.773Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "85966877649674",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "8673",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "-7040799.91",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "9591."
            },
            "required_quantity": "3",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "877",
      "article_id": 0,
      "cost_of_goods_sold": "7534.7",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "07492259249388",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "07505409",
  "is_in_progress": true
}
```

---

### `GET /api/commandes/kitchen/orders/`

> Endpoint spécifique pour la cuisine : récupère les commandes avec filtres date/service.

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "items_count": 0,
  "amount": "-954241.",
  "created_at": "2026-05-05T12:21:22.776Z",
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "30035835238597",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "status": "string",
  "kitchen_status": "string",
  "priority": "string",
  "created_by_id": 0,
  "restaurant_id": 0,
  "lignes": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-478780.",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "-7",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "-727062"
            },
            "required_quantity": "-14966",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "099.",
      "article_id": 0,
      "cost_of_goods_sold": "75754",
      "awaiting_service": true
    }
  ],
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "74400991856846",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0,
  "total_cost_of_goods_sold": "-5998.8",
  "is_in_progress": true
}
```

---

## dashboard

### `GET /api/dashboard/kpis/`

> Endpoint pour récupérer les KPIs du dashboard.
> `GET /api/dashboard/kpis?restaurant_id=X&date=YYYY-MM-DD`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `date` | query | string | | YYYY-MM-DD |
| `restaurant_id` | query | integer | ✅ | restaurant_id |

#### Responses

**200** — `application/json`

```json
{
  "restaurant_id": 0,
  "restaurant_name": "string",
  "date": "string",
  "kpis": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

**400** — `application/json`

```json
{ "error": "string" }
```

**404** — `application/json`

```json
{ "error": "string" }
```

---

### `GET /api/dashboard/map/`

> Endpoint pour récupérer la carte avec restaurants et fournisseurs.
> `GET /api/dashboard/map?restaurant_id=X`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `restaurant_id` | query | integer | restaurant_id |

#### Responses

**200** — `application/json`

```json
{
  "restaurants": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ],
  "suppliers": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ]
}
```

---

## employees

### `GET /api/employees/status/`

> `GET /api/employees/status?restaurant_id=X&date=YYYY-MM-DD`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `date` | query | string | YYYY-MM-DD |
| `restaurant_id` | query | integer | restaurant_id |

#### Responses

**200** — `application/json`

```json
[
  {
    "date": "string",
    "restaurant_id": 0,
    "employees": [
      {
        "additionalProp1": "string",
        "additionalProp2": "string",
        "additionalProp3": "string"
      }
    ]
  }
]
```

**400** — `application/json`

```json
{ "error": "string" }
```

---

## employes

### `GET /api/employes/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    }
  ]
}
```

---

### `POST /api/employes/`

#### Request body — `application/json`

```json
{
  "user_id": 0,
  "last_name": "string",
  "first_name": "string",
  "type_employe_id": 0,
  "salary": "0.00",
  "hire_date": "2026-05-05",
  "phone_number": "string"
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "user": {
    "id": 0,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string"
  },
  "last_name": "string",
  "first_name": "string",
  "type_employe": {
    "id": 0,
    "type_name": "string",
    "description": "string"
  },
  "salary": "0.00",
  "hire_date": "2026-05-05",
  "phone_number": "string"
}
```

---

### `GET /api/employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Employé. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "user": {
    "id": 0,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string"
  },
  "last_name": "string",
  "first_name": "string",
  "type_employe": {
    "id": 0,
    "type_name": "string",
    "description": "string"
  },
  "salary": "0.00",
  "hire_date": "2026-05-05",
  "phone_number": "string"
}
```

---

### `PUT /api/employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Employé. |

#### Request body — `application/json`

```json
{
  "user_id": 0,
  "last_name": "string",
  "first_name": "string",
  "type_employe_id": 0,
  "salary": "0.00",
  "hire_date": "2026-05-05",
  "phone_number": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "user": {
    "id": 0,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string"
  },
  "last_name": "string",
  "first_name": "string",
  "type_employe": {
    "id": 0,
    "type_name": "string",
    "description": "string"
  },
  "salary": "0.00",
  "hire_date": "2026-05-05",
  "phone_number": "string"
}
```

---

### `PATCH /api/employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Employé. |

#### Request body — `application/json`

```json
{
  "user_id": 0,
  "last_name": "string",
  "first_name": "string",
  "type_employe_id": 0,
  "salary": "0.00",
  "hire_date": "2026-05-05",
  "phone_number": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "user": {
    "id": 0,
    "username": "string",
    "email": "user@example.com",
    "first_name": "string",
    "last_name": "string"
  },
  "last_name": "string",
  "first_name": "string",
  "type_employe": {
    "id": 0,
    "type_name": "string",
    "description": "string"
  },
  "salary": "0.00",
  "hire_date": "2026-05-05",
  "phone_number": "string"
}
```

---

### `DELETE /api/employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Employé. |

#### Responses

**204** — No response body

---

## factures

> ViewSet pour gérer les factures.
>
> **Permissions requises** :
> - **Liste/Lecture** : `GENERATE_INVOICES` ou `VIEW_FINANCIAL_REPORTS`
> - **Création** : `GENERATE_INVOICES`
> - **Modification/Suppression** : `GENERATE_INVOICES` + (Admin ou Directeur)

### `GET /api/factures/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `date` | query | string($date) | date |
| `etat` | query | string | `en_attente` (En attente), `payee` (Payée), `annulee` (Annulée). Available values : `annulee`, `en_attente`, `payee` |
| `page` | query | integer | A page number within the paginated result set. |
| `restaurant` | query | integer | restaurant |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "number": "string",
      "date": "2026-05-05",
      "amount_before_tax": "-183.",
      "amount_including_tax": "3636",
      "vat_amount": "-300.",
      "amount_paid": "058763.9",
      "amount_due": "-819.",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "48388586677068",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "commande": 0,
      "state": "string",
      "created_at": "2026-05-05T12:21:22.820Z",
      "lignes": [
        {
          "id": 0,
          "product": {
            "id": 0,
            "name": "string",
            "categorie": {
              "id": 0,
              "name": "string",
              "display_order": 0,
              "description": "string"
            },
            "price": "-56540.74",
            "description": "string",
            "available": true
          },
          "quantity": 0,
          "unit_price_before_tax": "9.51",
          "unit_price_including_tax": "73835",
          "vat_rate": 0,
          "vat_amount": "-60.",
          "amount_including_tax": "142"
        }
      ],
      "vat_by_rate": {
        "additionalProp1": "string",
        "additionalProp2": "string",
        "additionalProp3": "string"
      }
    }
  ]
}
```

---

### `POST /api/factures/`

#### Request body — `application/json`

```json
{
  "number": "string",
  "date": "2026-05-05",
  "restaurant_id": 0,
  "commande": 0,
  "state": "string"
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "number": "string",
  "date": "2026-05-05",
  "amount_before_tax": "-646118.8",
  "amount_including_tax": "-1677586",
  "vat_amount": "-290",
  "amount_paid": "807963.0",
  "amount_due": "-749801",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "26459991839922",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "commande": 0,
  "state": "string",
  "created_at": "2026-05-05T12:21:22.829Z",
  "lignes": [
    {
      "id": 0,
      "product": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-84980149.79",
        "description": "string",
        "available": true
      },
      "quantity": 0,
      "unit_price_before_tax": "2531",
      "unit_price_including_tax": ".3",
      "vat_rate": 0,
      "vat_amount": "-5472",
      "amount_including_tax": "89"
    }
  ],
  "vat_by_rate": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `GET /api/factures/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_FACTURES. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "number": "string",
  "date": "2026-05-05",
  "amount_before_tax": "13.",
  "amount_including_tax": "-64346175.",
  "vat_amount": "-5515497.",
  "amount_paid": "041",
  "amount_due": "-6868.42",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "96546640874024",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "commande": 0,
  "state": "string",
  "created_at": "2026-05-05T12:21:22.832Z",
  "lignes": [
    {
      "id": 0,
      "product": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-7930",
        "description": "string",
        "available": true
      },
      "quantity": 0,
      "unit_price_before_tax": "-06",
      "unit_price_including_tax": "-741222",
      "vat_rate": 0,
      "vat_amount": "762.22",
      "amount_including_tax": "-"
    }
  ],
  "vat_by_rate": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `PUT /api/factures/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_FACTURES. |

#### Request body — `application/json`

```json
{
  "number": "string",
  "date": "2026-05-05",
  "restaurant_id": 0,
  "commande": 0,
  "state": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "number": "string",
  "date": "2026-05-05",
  "amount_before_tax": "",
  "amount_including_tax": "-99",
  "vat_amount": "3168898.0",
  "amount_paid": "55",
  "amount_due": "-74875560",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "68630862455748",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "commande": 0,
  "state": "string",
  "created_at": "2026-05-05T12:21:22.839Z",
  "lignes": [
    {
      "id": 0,
      "product": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "2264773.8",
        "description": "string",
        "available": true
      },
      "quantity": 0,
      "unit_price_before_tax": "6.",
      "unit_price_including_tax": "-26",
      "vat_rate": 0,
      "vat_amount": "-488.",
      "amount_including_tax": "-221706.7"
    }
  ],
  "vat_by_rate": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `PATCH /api/factures/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_FACTURES. |

#### Request body — `application/json`

```json
{
  "number": "string",
  "date": "2026-05-05",
  "restaurant_id": 0,
  "commande": 0,
  "state": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "number": "string",
  "date": "2026-05-05",
  "amount_before_tax": "96418662.3",
  "amount_including_tax": "117121.1",
  "vat_amount": "-1",
  "amount_paid": "892778.",
  "amount_due": "772764.91",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "66987148940341",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "commande": 0,
  "state": "string",
  "created_at": "2026-05-05T12:21:22.849Z",
  "lignes": [
    {
      "id": 0,
      "product": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "",
        "description": "string",
        "available": true
      },
      "quantity": 0,
      "unit_price_before_tax": "9108.9",
      "unit_price_including_tax": "-4345",
      "vat_rate": 0,
      "vat_amount": "596",
      "amount_including_tax": "35087178."
    }
  ],
  "vat_by_rate": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `DELETE /api/factures/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_FACTURES. |

#### Responses

**204** — No response body

---

### `PATCH /api/factures/{id}/marquer_payee/`

> Marque une facture comme payée. Permission requise : `PROCESS_PAYMENTS` ou `PROCESS_CASH`.

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_FACTURES. |

#### Request body — `application/json`

```json
{
  "number": "string",
  "date": "2026-05-05",
  "restaurant_id": 0,
  "commande": 0,
  "state": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "number": "string",
  "date": "2026-05-05",
  "amount_before_tax": "-91324393",
  "amount_including_tax": "-7.",
  "vat_amount": "83593",
  "amount_paid": "-14407",
  "amount_due": "-207103.",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "30579905702043",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "commande": 0,
  "state": "string",
  "created_at": "2026-05-05T12:21:22.859Z",
  "lignes": [
    {
      "id": 0,
      "product": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "124649.",
        "description": "string",
        "available": true
      },
      "quantity": 0,
      "unit_price_before_tax": "-36.",
      "unit_price_including_tax": "31489285.1",
      "vat_rate": 0,
      "vat_amount": "97.",
      "amount_including_tax": "26517.16"
    }
  ],
  "vat_by_rate": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

### `GET /api/factures/stats/`

> Retourne les statistiques globales de facturation. Permission requise : `VIEW_FINANCIAL_REPORTS`.

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "number": "string",
  "date": "2026-05-05",
  "amount_before_tax": "-765",
  "amount_including_tax": "-77485",
  "vat_amount": "83298",
  "amount_paid": "-",
  "amount_due": "-52757291",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "96780056260711",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "commande": 0,
  "state": "string",
  "created_at": "2026-05-05T12:21:22.860Z",
  "lignes": [
    {
      "id": 0,
      "product": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "20",
        "description": "string",
        "available": true
      },
      "quantity": 0,
      "unit_price_before_tax": "",
      "unit_price_including_tax": "-34",
      "vat_rate": 0,
      "vat_amount": ".60",
      "amount_including_tax": ".7"
    }
  ],
  "vat_by_rate": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  }
}
```

---

## ingredients

### `GET /api/ingredients/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "name": "string",
      "unit": "string",
      "unit_price": "."
    }
  ]
}
```

---

### `POST /api/ingredients/`

#### Request body — `application/json`

```json
{
  "name": "string",
  "unit": "string",
  "unit_price": "8565046."
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "unit": "string",
  "unit_price": "-"
}
```

---

### `GET /api/ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_INGREDIENTS. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "unit": "string",
  "unit_price": "-"
}
```

---

### `PUT /api/ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_INGREDIENTS. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "unit": "string",
  "unit_price": "076900."
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "unit": "string",
  "unit_price": "-243.7"
}
```

---

### `PATCH /api/ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_INGREDIENTS. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "unit": "string",
  "unit_price": "-725.6"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "unit": "string",
  "unit_price": ""
}
```

---

### `DELETE /api/ingredients/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_INGREDIENTS. |

#### Responses

**204** — No response body

---

## lignes-commandes

### `GET /api/lignes-commandes/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `article_id` | query | integer | article_id |
| `commande__statut` | query | string | `EN_COURS` (En cours), `VALIDEE` (Validée), `ANNULEE` (Annulée). Available values : `ANNULEE`, `EN_COURS`, `VALIDEE` |
| `commande_id` | query | integer | commande_id |
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "commande": "string",
      "article": {
        "id": 0,
        "name": "string",
        "categorie": {
          "id": 0,
          "name": "string",
          "display_order": 0,
          "description": "string"
        },
        "price": "-63",
        "description": "string",
        "available": true,
        "ingredients": [
          {
            "id": 0,
            "article": {
              "id": 0,
              "name": "string",
              "categorie": {
                "id": 0,
                "name": "string",
                "display_order": 0,
                "description": "string"
              },
              "price": "790.",
              "description": "string",
              "available": true
            },
            "ingredient": {
              "id": 0,
              "name": "string",
              "unit": "string",
              "unit_price": "95.74"
            },
            "required_quantity": "-853190",
            "article_id": 0,
            "ingredient_id": 0
          }
        ]
      },
      "quantity": 0,
      "unit_price": "2875811",
      "article_id": 0,
      "cost_of_goods_sold": "",
      "awaiting_service": true
    }
  ]
}
```

---

### `POST /api/lignes-commandes/`

#### Request body — `application/json`

```json
{
  "commande_id": 0,
  "quantity": 0,
  "article_id": 0,
  "awaiting_service": true
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "commande": "string",
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "-",
    "description": "string",
    "available": true,
    "ingredients": [
      {
        "id": 0,
        "article": {
          "id": 0,
          "name": "string",
          "categorie": {
            "id": 0,
            "name": "string",
            "display_order": 0,
            "description": "string"
          },
          "price": "607.",
          "description": "string",
          "available": true
        },
        "ingredient": {
          "id": 0,
          "name": "string",
          "unit": "string",
          "unit_price": "717.30"
        },
        "required_quantity": "4",
        "article_id": 0,
        "ingredient_id": 0
      }
    ]
  },
  "quantity": 0,
  "unit_price": "-",
  "article_id": 0,
  "cost_of_goods_sold": "-5620",
  "awaiting_service": true
}
```

---

### `GET /api/lignes-commandes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_LIGNE_COMMANDE. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "commande": "string",
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "-3244.64",
    "description": "string",
    "available": true,
    "ingredients": [
      {
        "id": 0,
        "article": {
          "id": 0,
          "name": "string",
          "categorie": {
            "id": 0,
            "name": "string",
            "display_order": 0,
            "description": "string"
          },
          "price": "03901339",
          "description": "string",
          "available": true
        },
        "ingredient": {
          "id": 0,
          "name": "string",
          "unit": "string",
          "unit_price": "804"
        },
        "required_quantity": "-600",
        "article_id": 0,
        "ingredient_id": 0
      }
    ]
  },
  "quantity": 0,
  "unit_price": "-8180218",
  "article_id": 0,
  "cost_of_goods_sold": "1731.95",
  "awaiting_service": true
}
```

---

### `PUT /api/lignes-commandes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_LIGNE_COMMANDE. |

#### Request body — `application/json`

```json
{
  "commande_id": 0,
  "quantity": 0,
  "article_id": 0,
  "awaiting_service": true
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "commande": "string",
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "-.6",
    "description": "string",
    "available": true,
    "ingredients": [
      {
        "id": 0,
        "article": {
          "id": 0,
          "name": "string",
          "categorie": {
            "id": 0,
            "name": "string",
            "display_order": 0,
            "description": "string"
          },
          "price": "8837288.9",
          "description": "string",
          "available": true
        },
        "ingredient": {
          "id": 0,
          "name": "string",
          "unit": "string",
          "unit_price": "-605.59"
        },
        "required_quantity": "-4.",
        "article_id": 0,
        "ingredient_id": 0
      }
    ]
  },
  "quantity": 0,
  "unit_price": "9.",
  "article_id": 0,
  "cost_of_goods_sold": "-62750876",
  "awaiting_service": true
}
```

---

### `PATCH /api/lignes-commandes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_LIGNE_COMMANDE. |

#### Request body — `application/json`

```json
{
  "commande_id": 0,
  "quantity": 0,
  "article_id": 0,
  "awaiting_service": true
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "commande": "string",
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "1021738.5",
    "description": "string",
    "available": true,
    "ingredients": [
      {
        "id": 0,
        "article": {
          "id": 0,
          "name": "string",
          "categorie": {
            "id": 0,
            "name": "string",
            "display_order": 0,
            "description": "string"
          },
          "price": "",
          "description": "string",
          "available": true
        },
        "ingredient": {
          "id": 0,
          "name": "string",
          "unit": "string",
          "unit_price": ""
        },
        "required_quantity": "-54.0363",
        "article_id": 0,
        "ingredient_id": 0
      }
    ]
  },
  "quantity": 0,
  "unit_price": "68230",
  "article_id": 0,
  "cost_of_goods_sold": "-5345070.18",
  "awaiting_service": true
}
```

---

### `DELETE /api/lignes-commandes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_LIGNE_COMMANDE. |

#### Responses

**204** — No response body

---

### `POST /api/lignes-commandes/{id}/deplacer/`

> Déplace l'article (ligne) vers une autre commande.
> **Body** : `{"commande_id": <int>}` ou `{"table_id": <int>}`.
> Si `table_id` est fourni et qu'aucune commande `EN_COURS` n'est sur cette table, retourne `400 "La table cible n'a pas de commande."`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_LIGNE_COMMANDE. |

#### Request body — `application/json`

```json
{
  "commande_id": 0,
  "quantity": 0,
  "article_id": 0,
  "awaiting_service": true
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "commande": "string",
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "-98355.0",
    "description": "string",
    "available": true,
    "ingredients": [
      {
        "id": 0,
        "article": {
          "id": 0,
          "name": "string",
          "categorie": {
            "id": 0,
            "name": "string",
            "display_order": 0,
            "description": "string"
          },
          "price": "85.01",
          "description": "string",
          "available": true
        },
        "ingredient": {
          "id": 0,
          "name": "string",
          "unit": "string",
          "unit_price": "7831."
        },
        "required_quantity": "-9797",
        "article_id": 0,
        "ingredient_id": 0
      }
    ]
  },
  "quantity": 0,
  "unit_price": "-",
  "article_id": 0,
  "cost_of_goods_sold": "-75418668",
  "awaiting_service": true
}
```

---

### `POST /api/lignes-commandes/{id}/reclamer/`

> Réclame une ligne mise en attente de service (ex : dessert). Passe `en_attente_service` à `False` pour que l'article soit pris en compte pour préparation/service.

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_LIGNE_COMMANDE. |

#### Request body — `application/json`

```json
{
  "commande_id": 0,
  "quantity": 0,
  "article_id": 0,
  "awaiting_service": true
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "commande": "string",
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "08052.66",
    "description": "string",
    "available": true,
    "ingredients": [
      {
        "id": 0,
        "article": {
          "id": 0,
          "name": "string",
          "categorie": {
            "id": 0,
            "name": "string",
            "display_order": 0,
            "description": "string"
          },
          "price": "42.35",
          "description": "string",
          "available": true
        },
        "ingredient": {
          "id": 0,
          "name": "string",
          "unit": "string",
          "unit_price": "69310720"
        },
        "required_quantity": "-04206",
        "article_id": 0,
        "ingredient_id": 0
      }
    ]
  },
  "quantity": 0,
  "unit_price": "-11.86",
  "article_id": 0,
  "cost_of_goods_sold": "37",
  "awaiting_service": true
}
```

---

### `POST /api/lignes-commandes/deplacer-selection/`

> Déplace une sélection de lignes de commande vers une autre commande.
> **Body** : `{ "ligne_ids": [1, 2, 3], "commande_id": <int> }` ou `{ "ligne_ids": [1, 2, 3], "table_id": <int> }`
>
> - Toutes les lignes doivent appartenir à la même commande source et au même restaurant.
> - Si `table_id` est fourni et qu'aucune commande `EN_COURS` n'existe sur cette table, une nouvelle commande `EN_COURS` est automatiquement créée sur cette table.

#### Request body — `application/json`

```json
{
  "commande_id": 0,
  "quantity": 0,
  "article_id": 0,
  "awaiting_service": true
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "commande": "string",
  "article": {
    "id": 0,
    "name": "string",
    "categorie": {
      "id": 0,
      "name": "string",
      "display_order": 0,
      "description": "string"
    },
    "price": "7924437",
    "description": "string",
    "available": true,
    "ingredients": [
      {
        "id": 0,
        "article": {
          "id": 0,
          "name": "string",
          "categorie": {
            "id": 0,
            "name": "string",
            "display_order": 0,
            "description": "string"
          },
          "price": "56578799",
          "description": "string",
          "available": true
        },
        "ingredient": {
          "id": 0,
          "name": "string",
          "unit": "string",
          "unit_price": "-."
        },
        "required_quantity": "-1341.5181",
        "article_id": 0,
        "ingredient_id": 0
      }
    ]
  },
  "quantity": 0,
  "unit_price": "-78292078.",
  "article_id": 0,
  "cost_of_goods_sold": "77307713.",
  "awaiting_service": true
}
```

---

## methodes-paiement

> Liste des méthodes de paiement disponibles (lecture seule). Accessible à tous les utilisateurs authentifiés.

### `GET /api/methodes-paiement/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "name": "string",
      "created_at": "2026-05-05T12:21:22.942Z"
    }
  ]
}
```

---

### `GET /api/methodes-paiement/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_METHODES_PAIEMENT. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "name": "string",
  "created_at": "2026-05-05T12:21:22.946Z"
}
```

---

## notes

> ViewSet pour gérer les notes.
> Auteur : [Votre Nom] · Créé : 27/04/2025 · Version : 1.0

### `GET /api/notes/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `created_by_id` | query | integer | created_by_id |
| `page` | query | integer | A page number within the paginated result set. |
| `restaurant_id` | query | integer | restaurant_id |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "created_by": {
        "id": 0,
        "user": {
          "id": 0,
          "username": "string",
          "email": "user@example.com",
          "first_name": "string",
          "last_name": "string"
        },
        "last_name": "string",
        "first_name": "string",
        "type_employe": {
          "id": 0,
          "type_name": "string",
          "description": "string"
        },
        "salary": "0.00",
        "hire_date": "2026-05-05",
        "phone_number": "string"
      },
      "created_at": "2026-05-05T12:21:22.951Z",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "13545410231304",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "message": "string"
    }
  ]
}
```

---

### `POST /api/notes/`

#### Request body — `application/json`

```json
{
  "created_by_id": 0,
  "restaurant_id": 0,
  "message": "string"
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "created_at": "2026-05-05T12:21:22.957Z",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "63939768327667",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "message": "string"
}
```

---

### `GET /api/notes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_NOTE. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "created_at": "2026-05-05T12:21:22.959Z",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "76413596697384",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "message": "string"
}
```

---

### `PUT /api/notes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_NOTE. |

#### Request body — `application/json`

```json
{
  "created_by_id": 0,
  "restaurant_id": 0,
  "message": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "created_at": "2026-05-05T12:21:22.967Z",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "52802236290867",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "message": "string"
}
```

---

### `PATCH /api/notes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_NOTE. |

#### Request body — `application/json`

```json
{
  "created_by_id": 0,
  "restaurant_id": 0,
  "message": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "created_by": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "created_at": "2026-05-05T12:21:22.974Z",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "30987488533682",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "message": "string"
}
```

---

### `DELETE /api/notes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_NOTE. |

#### Responses

**204** — No response body

---

## paiements

> ViewSet pour gérer les paiements.
>
> **Permissions requises** :
> - **Liste/Lecture** : `PROCESS_PAYMENTS` ou `VIEW_FINANCIAL_REPORTS`
> - **Création** : `PROCESS_PAYMENTS` ou `PROCESS_CASH`
> - **Modification/Suppression** : Réservé aux Admins et Directeurs

### `GET /api/paiements/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `facture` | query | integer | facture |
| `methode_paiement` | query | integer | methode_paiement |
| `page` | query | integer | A page number within the paginated result set. |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "methode_paiement": {
        "id": 0,
        "name": "string",
        "created_at": "2026-05-05T12:21:22.979Z"
      },
      "amount": "-",
      "created_at": "2026-05-05T12:21:22.979Z"
    }
  ]
}
```

---

### `POST /api/paiements/`

#### Request body — `application/json`

```json
{
  "facture_id": 0,
  "methode_paiement_id": 0,
  "amount": "84165791."
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "methode_paiement": {
    "id": 0,
    "name": "string",
    "created_at": "2026-05-05T12:21:22.985Z"
  },
  "amount": "9",
  "created_at": "2026-05-05T12:21:22.985Z"
}
```

---

### `GET /api/paiements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_PAIEMENTS. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "methode_paiement": {
    "id": 0,
    "name": "string",
    "created_at": "2026-05-05T12:21:22.988Z"
  },
  "amount": "8961",
  "created_at": "2026-05-05T12:21:22.988Z"
}
```

---

### `PUT /api/paiements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_PAIEMENTS. |

#### Request body — `application/json`

```json
{
  "facture_id": 0,
  "methode_paiement_id": 0,
  "amount": "-0480.9"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "methode_paiement": {
    "id": 0,
    "name": "string",
    "created_at": "2026-05-05T12:21:22.997Z"
  },
  "amount": "-00",
  "created_at": "2026-05-05T12:21:22.997Z"
}
```

---

### `PATCH /api/paiements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_PAIEMENTS. |

#### Request body — `application/json`

```json
{
  "facture_id": 0,
  "methode_paiement_id": 0,
  "amount": "-092919"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "methode_paiement": {
    "id": 0,
    "name": "string",
    "created_at": "2026-05-05T12:21:23.004Z"
  },
  "amount": "5",
  "created_at": "2026-05-05T12:21:23.004Z"
}
```

---

### `DELETE /api/paiements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this T_HOLLY_PI_PAIEMENTS. |

#### Responses

**204** — No response body

---

## planning

### `GET /api/planning/shifts/`

#### Parameters

| Name | In | Type | Description |
|---|---|---|---|
| `employe_id` | query | integer | employe_id |
| `page` | query | integer | A page number within the paginated result set. |
| `restaurant_id` | query | integer | restaurant_id |
| `type_shift` | query | string | `MORNING` (Matin), `AFTERNOON` (Après-midi), `EVENING` (Soir), `NIGHT` (Nuit). Available values : `AFTERNOON`, `EVENING`, `MORNING`, `NIGHT` |

#### Responses

**200** — `application/json`

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "employe": {
        "id": 0,
        "user": {
          "id": 0,
          "username": "string",
          "email": "user@example.com",
          "first_name": "string",
          "last_name": "string"
        },
        "last_name": "string",
        "first_name": "string",
        "type_employe": {
          "id": 0,
          "type_name": "string",
          "description": "string"
        },
        "salary": "0.00",
        "hire_date": "2026-05-05",
        "phone_number": "string"
      },
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "78751601058282",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "start_date": "2026-05-05T12:21:23.011Z",
      "end_date": "2026-05-05T12:21:23.011Z",
      "shift_type": "string",
      "notes": "string",
      "created_at": "2026-05-05T12:21:23.011Z",
      "updated_at": "2026-05-05T12:21:23.011Z"
    }
  ]
}
```

---

### `POST /api/planning/shifts/`

#### Request body — `application/json`

```json
{
  "employe_id": 0,
  "restaurant_id": 0,
  "start_date": "2026-05-05T12:21:19.885Z",
  "end_date": "2026-05-05T12:21:19.885Z",
  "shift_type": "string",
  "notes": "string"
}
```

#### Responses

**201** — `application/json`

```json
{
  "id": 0,
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "14397005709990",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "start_date": "2026-05-05T12:21:23.017Z",
  "end_date": "2026-05-05T12:21:23.017Z",
  "shift_type": "string",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.017Z",
  "updated_at": "2026-05-05T12:21:23.017Z"
}
```

---

### `GET /api/planning/shifts/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Créneau horaire. |

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "12748414643801",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "start_date": "2026-05-05T12:21:23.020Z",
  "end_date": "2026-05-05T12:21:23.020Z",
  "shift_type": "string",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.020Z",
  "updated_at": "2026-05-05T12:21:23.020Z"
}
```

---

### `PUT /api/planning/shifts/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Créneau horaire. |

#### Request body — `application/json`

```json
{
  "employe_id": 0,
  "restaurant_id": 0,
  "start_date": "2026-05-05T12:21:19.894Z",
  "end_date": "2026-05-05T12:21:19.894Z",
  "shift_type": "string",
  "notes": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "16018027542529",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "start_date": "2026-05-05T12:21:23.027Z",
  "end_date": "2026-05-05T12:21:23.027Z",
  "shift_type": "string",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.027Z",
  "updated_at": "2026-05-05T12:21:23.027Z"
}
```

---

### `PATCH /api/planning/shifts/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Créneau horaire. |

#### Request body — `application/json`

```json
{
  "employe_id": 0,
  "restaurant_id": 0,
  "start_date": "2026-05-05T12:21:19.900Z",
  "end_date": "2026-05-05T12:21:19.900Z",
  "shift_type": "string",
  "notes": "string"
}
```

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "85262060378572",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "start_date": "2026-05-05T12:21:23.034Z",
  "end_date": "2026-05-05T12:21:23.034Z",
  "shift_type": "string",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.034Z",
  "updated_at": "2026-05-05T12:21:23.034Z"
}
```

---

### `DELETE /api/planning/shifts/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | ✅ | A unique integer value identifying this Créneau horaire. |

#### Responses

**204** — No response body

---

### `GET /api/planning/shifts/emploi-du-temps/`

**Emploi du temps d'un employé pour une semaine**

> Retourne l'emploi du temps (créneaux par jour) pour un employé et une semaine donnée. Nécessite une authentification (Bearer token après login ou quick-login).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `employe_id` | query | integer | ✅ | ID de l'employé |
| `restaurant_id` | query | integer | | ID du restaurant (recommandé si l'employé a des créneaux dans plusieurs établissements) |
| `week` | query | string | ✅ | Semaine au format ISO : `YYYY-Www` (ex. `2026-W10`) |

#### Responses

**200** — `application/json`

```json
{
  "restaurant": {
    "id": 0,
    "nom": "string"
  },
  "semaine": {
    "debut": "string",
    "fin": "string"
  },
  "jours": [
    {
      "date": "string",
      "jour": "string",
      "creneaux": [
        {
          "debut": "string",
          "fin": "string"
        }
      ],
      "total_heures": 0
    }
  ],
  "total_semaine_heures": 0
}
```

**400** — `application/json`

```json
{ "error": "string" }
```

**401** — `application/json`

```json
{ "detail": "string" }
```

**404** — `application/json`

```json
{ "error": "string" }
```

---

### `GET /api/planning/shifts/stats/`

> `GET /api/planning/stats?week=YYYY-Www&restaurant_id=X`

#### Responses

**200** — `application/json`

```json
{
  "id": 0,
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "76245809510186",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "start_date": "2026-05-05T12:21:23.046Z",
  "end_date": "2026-05-05T12:21:23.046Z",
  "shift_type": "string",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.046Z",
  "updated_at": "2026-05-05T12:21:23.046Z"
}
```

---

## reapprovisionnements

### `GET /api/reapprovisionnements/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `ingredient_id` | query | integer | non | ingredient_id |
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant_id` | query | integer | non | restaurant_id |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "65116037364920",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "ingredient": {
        "id": 0,
        "name": "string",
        "unit": "string",
        "unit_price": "84000397"
      },
      "quantity_added": "70",
      "added_at": "2026-05-05T12:21:23.050Z",
      "purchase_price": "218",
      "restaurant_id": 0,
      "ingredient_id": 0
    }
  ]
}
```

---

### `POST /api/reapprovisionnements/`

#### Request body — `application/json`

```json
{
  "quantity_added": "895",
  "purchase_price": "0299608",
  "restaurant_id": 0,
  "ingredient_id": 0
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "80987548374601",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "194330."
  },
  "quantity_added": "-5453.333",
  "added_at": "2026-05-05T12:21:23.056Z",
  "purchase_price": "-529.2",
  "restaurant_id": 0,
  "ingredient_id": 0
}
```

---

### `GET /api/reapprovisionnements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_REAPPROVISIONNEMENTS. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "52188220395118",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "-93784.92"
  },
  "quantity_added": "-0370920.",
  "added_at": "2026-05-05T12:21:23.059Z",
  "purchase_price": "-3.6",
  "restaurant_id": 0,
  "ingredient_id": 0
}
```

---

### `PUT /api/reapprovisionnements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_REAPPROVISIONNEMENTS. |

#### Request body — `application/json`

```json
{
  "quantity_added": "76363254",
  "purchase_price": "195",
  "restaurant_id": 0,
  "ingredient_id": 0
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "68713942557040",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "-1"
  },
  "quantity_added": "-",
  "added_at": "2026-05-05T12:21:23.066Z",
  "purchase_price": "74.",
  "restaurant_id": 0,
  "ingredient_id": 0
}
```

---

### `PATCH /api/reapprovisionnements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_REAPPROVISIONNEMENTS. |

#### Request body — `application/json`

```json
{
  "quantity_added": "-120866.175",
  "purchase_price": "58709.",
  "restaurant_id": 0,
  "ingredient_id": 0
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "83590896604074",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": ""
  },
  "quantity_added": "-35202961",
  "added_at": "2026-05-05T12:21:23.073Z",
  "purchase_price": "62",
  "restaurant_id": 0,
  "ingredient_id": 0
}
```

---

### `DELETE /api/reapprovisionnements/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_REAPPROVISIONNEMENTS. |

#### Responses

**`204`** — No response body.

---

## reports

### `GET /api/reports/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant` | query | integer | non | restaurant |
| `type_report` | query | string | non | Filtre par type de rapport. Valeurs disponibles : `CUSTOM`, `FINANCIAL`, `SALES`, `STAFF`, `STOCK`. Mapping : `SALES` (Ventes), `STOCK` (Stocks), `STAFF` (Personnel), `FINANCIAL` (Financier), `CUSTOM` (Personnalisé). |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "19172410096685",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "report_type": "string",
      "period_start": "2026-05-05",
      "period_end": "2026-05-05",
      "file": "string",
      "file_url": "string",
      "generated_at": "2026-05-05T12:21:23.078Z",
      "created_by": 0
    }
  ]
}
```

---

### `POST /api/reports/`

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string"
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "79899864509207",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string",
  "file_url": "string",
  "generated_at": "2026-05-05T12:21:23.084Z",
  "created_by": 0
}
```

---

### `GET /api/reports/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Rapport. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "52406220534750",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string",
  "file_url": "string",
  "generated_at": "2026-05-05T12:21:23.086Z",
  "created_by": 0
}
```

---

### `PUT /api/reports/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Rapport. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "46574889120446",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string",
  "file_url": "string",
  "generated_at": "2026-05-05T12:21:23.096Z",
  "created_by": 0
}
```

---

### `PATCH /api/reports/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Rapport. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "76476815316419",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string",
  "file_url": "string",
  "generated_at": "2026-05-05T12:21:23.103Z",
  "created_by": 0
}
```

---

### `DELETE /api/reports/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Rapport. |

#### Responses

**`204`** — No response body.

---

### `GET /api/reports/{id}/download/`

> `GET /api/reports/{id}/download`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Rapport. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "36586181338268",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "report_type": "string",
  "period_start": "2026-05-05",
  "period_end": "2026-05-05",
  "file": "string",
  "file_url": "string",
  "generated_at": "2026-05-05T12:21:23.106Z",
  "created_by": 0
}
```

---

## reservations

### `GET /api/reservations/` — Liste des réservations

> Liste des réservations avec filtres optionnels : `id`, `restaurant_id`, `salle_id`, `table_id`, `date` (YYYY-MM-DD), `service` (midi|soir).

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `date` | query | string | non | Date au format YYYY-MM-DD |
| `id` | query | integer | non | ID de la réservation |
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant_id` | query | integer | non | ID du restaurant |
| `salle_id` | query | integer | non | ID de la salle |
| `service` | query | string | non | Service : `midi` (heure < 15h) ou `soir` (heure >= 15h) |
| `table_id` | query | integer | non | ID de la table réservée |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "client_name": "string",
      "party_size": 0,
      "datetime": "2026-05-05T12:21:23.114Z",
      "phone_number": "string",
      "salle": {
        "id": 0,
        "name": "string",
        "restaurant": {
          "restaurant_id": 0,
          "name": "string",
          "address": "string",
          "postal_code": "string",
          "city": "string",
          "phone_number": "string",
          "siret": "07173678010641",
          "naf_code": "string",
          "pin": "string",
          "logo_url": "string"
        },
        "capacity": 0,
        "floor": 0,
        "description": "string"
      },
      "salle_id": 0,
      "table": {
        "id": 0,
        "numero": 1,
        "capacity": 9223372036854776000,
        "reserved_seats": 9223372036854776000,
        "is_occupied": true,
        "salle": {
          "id": 0,
          "name": "string",
          "restaurant": {
            "restaurant_id": 0,
            "name": "string",
            "address": "string",
            "postal_code": "string",
            "city": "string",
            "phone_number": "string",
            "siret": "52194150345277",
            "naf_code": "string",
            "pin": "string",
            "logo_url": "string"
          },
          "capacity": 0,
          "floor": 0,
          "description": "string"
        },
        "employee_in_charge": {
          "id": 0,
          "user": {
            "id": 0,
            "username": "string",
            "email": "user@example.com",
            "first_name": "string",
            "last_name": "string"
          },
          "last_name": "string",
          "first_name": "string",
          "type_employe": {
            "id": 0,
            "type_name": "string",
            "description": "string"
          },
          "salary": "0.00",
          "hire_date": "2026-05-05",
          "phone_number": "string"
        },
        "salle_id": 0,
        "employee_in_charge_id": 0,
        "position_x": 9223372036854776000,
        "position_y": 9223372036854776000
      },
      "table_id": 0
    }
  ]
}
```

---

### `POST /api/reservations/` — Créer une réservation

> Créer une réservation. Optionnellement associer une table (`table_id`) ; la table doit appartenir à la salle et être libre au créneau.

#### Request body — `application/json`

```json
{
  "client_name": "string",
  "party_size": 0,
  "datetime": "2026-05-05T12:21:19.985Z",
  "phone_number": "string",
  "salle_id": 0,
  "table_id": 0
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "client_name": "string",
  "party_size": 0,
  "datetime": "2026-05-05T12:21:23.121Z",
  "phone_number": "string",
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "54272700640419",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "salle_id": 0,
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "85703880314702",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0
}
```

---

### `GET /api/reservations/{id}/` — Détail d'une réservation

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESERVATIONS. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "client_name": "string",
  "party_size": 0,
  "datetime": "2026-05-05T12:21:23.124Z",
  "phone_number": "string",
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "39590499518830",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "salle_id": 0,
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "73324612609889",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0
}
```

---

### `PUT /api/reservations/{id}/` — Modifier une réservation

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESERVATIONS. |

#### Request body — `application/json`

```json
{
  "client_name": "string",
  "party_size": 0,
  "datetime": "2026-05-05T12:21:19.996Z",
  "phone_number": "string",
  "salle_id": 0,
  "table_id": 0
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "client_name": "string",
  "party_size": 0,
  "datetime": "2026-05-05T12:21:23.131Z",
  "phone_number": "string",
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "90524838821051",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "salle_id": 0,
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "35108729513652",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0
}
```

---

### `PATCH /api/reservations/{id}/` — Modifier partiellement une réservation

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESERVATIONS. |

#### Request body — `application/json`

```json
{
  "client_name": "string",
  "party_size": 0,
  "datetime": "2026-05-05T12:21:20.005Z",
  "phone_number": "string",
  "salle_id": 0,
  "table_id": 0
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "client_name": "string",
  "party_size": 0,
  "datetime": "2026-05-05T12:21:23.141Z",
  "phone_number": "string",
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "96471733438865",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "salle_id": 0,
  "table": {
    "id": 0,
    "numero": 1,
    "capacity": 9223372036854776000,
    "reserved_seats": 9223372036854776000,
    "is_occupied": true,
    "salle": {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "13131991245580",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    },
    "employee_in_charge": {
      "id": 0,
      "user": {
        "id": 0,
        "username": "string",
        "email": "user@example.com",
        "first_name": "string",
        "last_name": "string"
      },
      "last_name": "string",
      "first_name": "string",
      "type_employe": {
        "id": 0,
        "type_name": "string",
        "description": "string"
      },
      "salary": "0.00",
      "hire_date": "2026-05-05",
      "phone_number": "string"
    },
    "salle_id": 0,
    "employee_in_charge_id": 0,
    "position_x": 9223372036854776000,
    "position_y": 9223372036854776000
  },
  "table_id": 0
}
```

---

### `DELETE /api/reservations/{id}/` — Supprimer une réservation

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESERVATIONS. |

#### Responses

**`204`** — No response body.

---

## restaurant-employes

### `GET /api/restaurant-employes/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `employe` | query | integer | non | employe |
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant` | query | integer | non | restaurant |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "73752942332994",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "employe": {
        "id": 0,
        "user": {
          "id": 0,
          "username": "string",
          "email": "user@example.com",
          "first_name": "string",
          "last_name": "string"
        },
        "last_name": "string",
        "first_name": "string",
        "type_employe": {
          "id": 0,
          "type_name": "string",
          "description": "string"
        },
        "salary": "0.00",
        "hire_date": "2026-05-05",
        "phone_number": "string"
      }
    }
  ]
}
```

---

### `POST /api/restaurant-employes/`

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "employe_id": 0
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "81046732869826",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  }
}
```

---

### `GET /api/restaurant-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Association Restaurant-Employé. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "82885784211091",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  }
}
```

---

### `PUT /api/restaurant-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Association Restaurant-Employé. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "employe_id": 0
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "47433261733050",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  }
}
```

---

### `PATCH /api/restaurant-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Association Restaurant-Employé. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "employe_id": 0
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "39374614119685",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "employe": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  }
}
```

---

### `DELETE /api/restaurant-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Association Restaurant-Employé. |

#### Responses

**`204`** — No response body.

---

## restaurants

> ViewSet pour la gestion des restaurants.
>
> Endpoints :
>
> - `GET /api/restaurants/` — Liste des restaurants
> - `POST /api/restaurants/` — Créer un restaurant
> - `GET /api/restaurants/{id_restaurant}/` — Détail d'un restaurant
> - `PUT/PATCH /api/restaurants/{id_restaurant}/` — Modifier un restaurant
> - `DELETE /api/restaurants/{id_restaurant}/` — Supprimer un restaurant
> - `GET /api/restaurants/logo/{id}/` — Récupérer le logo

### `GET /api/restaurants/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `page` | query | integer | non | A page number within the paginated result set. |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "66696692652253",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    }
  ]
}
```

---

### `POST /api/restaurants/`

> Crée un nouveau restaurant et ajoute automatiquement l'utilisateur qui le crée comme manager.

#### Request body — `application/json`

```json
{
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "09394571995458",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "53799044443573",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

---

### `GET /api/restaurants/{id_restaurant}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id_restaurant` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESTAURANTS. |

#### Responses

**`200` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "34803599029084",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

---

### `PUT /api/restaurants/{id_restaurant}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id_restaurant` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESTAURANTS. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "85064656096613",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "22215796062115",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

---

### `PATCH /api/restaurants/{id_restaurant}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id_restaurant` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESTAURANTS. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "54994682971501",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "99351317786477",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

---

### `DELETE /api/restaurants/{id_restaurant}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id_restaurant` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_RESTAURANTS. |

#### Responses

**`204`** — No response body.

---

### `GET /api/restaurants/logo/{id_restaurant}/`

> Récupère uniquement l'URL du logo d'un restaurant.
>
> Usage : `GET /api/restaurants/logo/{id_restaurant}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id_restaurant` | path | string | oui | id_restaurant |

#### Responses

**`200` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "32440171581160",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

---

### `GET /api/restaurants/verify/{id_restaurant}/`

> Endpoint public pour vérifier l'existence d'un restaurant. Utilisé avant l'authentification pour vérifier que le restaurant existe.
>
> Usage : `GET /api/restaurants/verify/{id_restaurant}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id_restaurant` | path | string | oui | id_restaurant |

#### Responses

**`200` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "28253181421669",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

---

## salles

### `GET /api/salles/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant_id` | query | integer | non | restaurant_id |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "name": "string",
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "81967257203607",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "capacity": 0,
      "floor": 0,
      "description": "string"
    }
  ]
}
```

---

### `POST /api/salles/`

#### Request body — `application/json`

```json
{
  "name": "string",
  "restaurant_id": 0,
  "capacity": 0,
  "floor": 0,
  "description": "string"
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "34082158055000",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "capacity": 0,
  "floor": 0,
  "description": "string"
}
```

---

### `GET /api/salles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_SALLES. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "74656256630760",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "capacity": 0,
  "floor": 0,
  "description": "string"
}
```

---

### `PUT /api/salles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_SALLES. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "restaurant_id": 0,
  "capacity": 0,
  "floor": 0,
  "description": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "01054862608266",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "capacity": 0,
  "floor": 0,
  "description": "string"
}
```

---

### `PATCH /api/salles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_SALLES. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "restaurant_id": 0,
  "capacity": 0,
  "floor": 0,
  "description": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "86880709105242",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "capacity": 0,
  "floor": 0,
  "description": "string"
}
```

---

### `DELETE /api/salles/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_SALLES. |

#### Responses

**`204`** — No response body.

---

## settings

### `GET /api/settings/billing/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant_id` | query | integer | non | restaurant_id |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "64117559298747",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "default_vat_rate": "8",
      "currency": "string",
      "auto_invoice": true,
      "created_at": "2026-05-05T12:21:23.244Z",
      "updated_at": "2026-05-05T12:21:23.244Z"
    }
  ]
}
```

---

### `POST /api/settings/billing/`

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "default_vat_rate": "-5.44",
  "currency": "string",
  "auto_invoice": true
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "03835692237811",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "default_vat_rate": "-.0",
  "currency": "string",
  "auto_invoice": true,
  "created_at": "2026-05-05T12:21:23.250Z",
  "updated_at": "2026-05-05T12:21:23.250Z"
}
```

---

### `GET /api/settings/billing/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de facturation. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "83320651479780",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "default_vat_rate": "3",
  "currency": "string",
  "auto_invoice": true,
  "created_at": "2026-05-05T12:21:23.253Z",
  "updated_at": "2026-05-05T12:21:23.253Z"
}
```

---

### `PUT /api/settings/billing/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de facturation. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "default_vat_rate": "-180",
  "currency": "string",
  "auto_invoice": true
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "90145673937625",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "default_vat_rate": "",
  "currency": "string",
  "auto_invoice": true,
  "created_at": "2026-05-05T12:21:23.259Z",
  "updated_at": "2026-05-05T12:21:23.259Z"
}
```

---

### `PATCH /api/settings/billing/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de facturation. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "default_vat_rate": "4.72",
  "currency": "string",
  "auto_invoice": true
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "41287138896124",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "default_vat_rate": "-1.32",
  "currency": "string",
  "auto_invoice": true,
  "created_at": "2026-05-05T12:21:23.267Z",
  "updated_at": "2026-05-05T12:21:23.267Z"
}
```

---

### `DELETE /api/settings/billing/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de facturation. |

#### Responses

**`204`** — No response body.

---

### `GET /api/settings/notifications/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant_id` | query | integer | non | restaurant_id |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "98615841712313",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "email_notifications": true,
      "sms_notifications": true,
      "stock_alerts": true,
      "reservation_alerts": true,
      "command_alerts": true,
      "created_at": "2026-05-05T12:21:23.271Z",
      "updated_at": "2026-05-05T12:21:23.271Z"
    }
  ]
}
```

---

### `POST /api/settings/notifications/`

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "email_notifications": true,
  "sms_notifications": true,
  "stock_alerts": true,
  "reservation_alerts": true,
  "command_alerts": true
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "30294579679379",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "email_notifications": true,
  "sms_notifications": true,
  "stock_alerts": true,
  "reservation_alerts": true,
  "command_alerts": true,
  "created_at": "2026-05-05T12:21:23.277Z",
  "updated_at": "2026-05-05T12:21:23.277Z"
}
```

---

### `GET /api/settings/notifications/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de notifications. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "19571919210726",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "email_notifications": true,
  "sms_notifications": true,
  "stock_alerts": true,
  "reservation_alerts": true,
  "command_alerts": true,
  "created_at": "2026-05-05T12:21:23.279Z",
  "updated_at": "2026-05-05T12:21:23.279Z"
}
```

---

### `PUT /api/settings/notifications/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de notifications. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "email_notifications": true,
  "sms_notifications": true,
  "stock_alerts": true,
  "reservation_alerts": true,
  "command_alerts": true
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "23610718158716",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "email_notifications": true,
  "sms_notifications": true,
  "stock_alerts": true,
  "reservation_alerts": true,
  "command_alerts": true,
  "created_at": "2026-05-05T12:21:23.286Z",
  "updated_at": "2026-05-05T12:21:23.286Z"
}
```

---

### `PATCH /api/settings/notifications/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de notifications. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "email_notifications": true,
  "sms_notifications": true,
  "stock_alerts": true,
  "reservation_alerts": true,
  "command_alerts": true
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "18023109004123",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "email_notifications": true,
  "sms_notifications": true,
  "stock_alerts": true,
  "reservation_alerts": true,
  "command_alerts": true,
  "created_at": "2026-05-05T12:21:23.296Z",
  "updated_at": "2026-05-05T12:21:23.296Z"
}
```

---

### `DELETE /api/settings/notifications/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Paramètres de notifications. |

#### Responses

**`204`** — No response body.

---

### `GET /api/settings/restaurant/`

> `GET /api/settings/restaurant?restaurant_id=X`
> `PATCH /api/settings/restaurant?restaurant_id=X`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `restaurant_id` | query | integer | oui | restaurant_id |

#### Responses

**`200` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "74427995403258",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

**`400`** — No response body.

**`404`** — No response body.

---

### `PATCH /api/settings/restaurant/`

> `GET /api/settings/restaurant?restaurant_id=X`
> `PATCH /api/settings/restaurant?restaurant_id=X`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `restaurant_id` | query | integer | oui | restaurant_id |

#### Request body — `application/json`

```json
{
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "59133114462001",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "restaurant_id": 0,
  "name": "string",
  "address": "string",
  "postal_code": "string",
  "city": "string",
  "phone_number": "string",
  "siret": "64581288461131",
  "naf_code": "string",
  "pin": "string",
  "logo_url": "string"
}
```

**`400`** — No response body.

**`404`** — No response body.

---

### `GET /api/settings/users/`

> `GET /api/settings/users?restaurant_id=X` — liste des utilisateurs
> `POST /api/settings/users` — création utilisateur

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `restaurant_id` | query | integer | non | restaurant_id |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "date_joined": "2026-05-05T12:21:23.310Z",
  "is_active": true,
  "mfa_enabled": true
}
```

---

### `POST /api/settings/users/`

> `GET /api/settings/users?restaurant_id=X` — liste des utilisateurs
> `POST /api/settings/users` — création utilisateur

#### Request body — `application/json`

```json
{
  "username": "2XSLUaBVsYFbSeqmds+F2LMfjhID-1uI.stZoD0AqCHMfhvvGAcY.zzgQx",
  "email": "user@example.com",
  "password": "string",
  "password2": "string",
  "first_name": "string",
  "last_name": "string",
  "employee_first_name": "string",
  "employee_last_name": "string",
  "pin_code": "8631",
  "type_employe_id": 0,
  "restaurant_id": 0
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "date_joined": "2026-05-05T12:21:23.316Z",
  "is_active": true,
  "mfa_enabled": true
}
```

**`400`** — No response body.

---

### `GET /api/settings/users/{user_id}/`

> `GET /api/settings/users/{user_id}/` — détail d'un utilisateur
> `PATCH /api/settings/users/{user_id}/` — mise à jour partielle

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `user_id` | path | integer | oui | user_id |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "date_joined": "2026-05-05T12:21:23.318Z",
  "is_active": true,
  "mfa_enabled": true
}
```

**`404`** — No response body.

---

### `PATCH /api/settings/users/{user_id}/`

> `GET /api/settings/users/{user_id}/` — détail d'un utilisateur
> `PATCH /api/settings/users/{user_id}/` — mise à jour partielle

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `user_id` | path | integer | oui | user_id |

#### Request body — `application/json`

```json
{
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "username": "string",
  "email": "user@example.com",
  "first_name": "string",
  "last_name": "string",
  "date_joined": "2026-05-05T12:21:23.326Z",
  "is_active": true,
  "mfa_enabled": true
}
```

**`400`** — No response body.

**`404`** — No response body.

---

## staff

### `GET /api/staff/permissions/{permission_name}/roles/`

> Retourne les rôles qui possèdent une permission spécifique.
>
> `GET /api/staff/permissions/{permission_name}/roles/`
>
> Args : `permission_name` — Le nom de la permission.
>
> Returns :
>
> ```json
> {
>   "permission": "manage_staff",
>   "roles": [
>     "Super Admin Groupe",
>     "Admin Établissement",
>     "..."
>   ]
> }
> ```

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `permission_name` | path | string | oui | permission_name |

#### Responses

**`200` — `application/json`**

```json
{
  "permission": "string",
  "roles": [
    "string"
  ],
  "count": 0
}
```

**`400` — `application/json`**

```json
{
  "error": "string"
}
```

---

### `POST /api/staff/permissions/check/`

> Vérifie si l'utilisateur connecté possède une permission.
>
> `POST /api/staff/permissions/check/`
>
> Body :
>
> ```json
> { "permission": "manage_staff" }
> ```
>
> Returns :
>
> ```json
> {
>   "has_permission": true,
>   "permission": "manage_staff",
>   "role": "Admin Établissement"
> }
> ```

#### Request body — `application/json`

```json
{
  "permission": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "has_permission": true,
  "permission": "string",
  "role": "string"
}
```

**`400` — `application/json`**

```json
{
  "error": "string"
}
```

**`500` — `application/json`**

```json
{
  "error": "string",
  "detail": "string"
}
```

---

### `POST /api/staff/permissions/check-multiple/`

> Vérifie si l'utilisateur possède plusieurs permissions.
>
> `POST /api/staff/permissions/check-multiple/`
>
> Body :
>
> ```json
> {
>   "permissions": ["manage_staff", "manage_service"],
>   "require_all": false
> }
> ```
>
> Returns :
>
> ```json
> {
>   "has_permissions": true,
>   "require_all": false,
>   "results": {
>     "manage_staff": true,
>     "manage_service": false
>   }
> }
> ```

#### Request body — `application/json`

```json
{
  "permissions": [
    "string"
  ],
  "require_all": false
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "has_permissions": true,
  "require_all": true,
  "results": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  },
  "role": "string"
}
```

**`400` — `application/json`**

```json
{
  "error": "string"
}
```

**`500` — `application/json`**

```json
{
  "error": "string",
  "detail": "string"
}
```

---

### `POST /api/staff/permissions/compare-roles/`

> Compare deux rôles pour déterminer leur hiérarchie.
>
> `POST /api/staff/permissions/compare-roles/`
>
> Body :
>
> ```json
> {
>   "role1": "Admin Établissement",
>   "role2": "Serveur"
> }
> ```
>
> Returns :
>
> ```json
> {
>   "role1": "Admin Établissement",
>   "role2": "Serveur",
>   "role1_higher": true,
>   "hierarchy_difference": 8
> }
> ```

#### Request body — `application/json`

```json
{
  "role1": "string",
  "role2": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "role1": "string",
  "role2": "string",
  "role1_higher": true,
  "role1_level": 0,
  "role2_level": 0,
  "hierarchy_difference": 0
}
```

**`400` — `application/json`**

```json
{
  "error": "string"
}
```

---

### `GET /api/staff/permissions/hierarchy/`

> Retourne la hiérarchie complète des rôles. Accessible uniquement aux administrateurs et directeurs.
>
> `GET /api/staff/permissions/hierarchy/`
>
> Returns :
>
> ```json
> {
>   "hierarchy": [
>     { "level": 0, "role": "Super Admin Groupe", "permissions_count": 25 }
>   ]
> }
> ```

#### Responses

**`200` — `application/json`**

```json
{
  "hierarchy": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ],
  "total_levels": 0
}
```

---

### `GET /api/staff/permissions/list/`

> Retourne la liste de toutes les permissions disponibles.
>
> `GET /api/staff/permissions/list/`
>
> Returns :
>
> ```json
> {
>   "permissions": [
>     { "name": "view_all_establishments", "value": "view_all_establishments" }
>   ]
> }
> ```

#### Responses

**`200` — `application/json`**

```json
{
  "permissions": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ],
  "count": 0
}
```

---

### `GET /api/staff/permissions/matrix/`

> Retourne la matrice complète des permissions par rôle. Accessible uniquement aux administrateurs et directeurs.
>
> `GET /api/staff/permissions/matrix/`
>
> Returns :
>
> ```json
> {
>   "matrix": {
>     "Super Admin Groupe": ["perm1", "perm2"],
>     "Admin Établissement": ["perm1", "perm2"]
>   }
> }
> ```

#### Responses

**`200` — `application/json`**

```json
{
  "matrix": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  },
  "roles_count": 0,
  "total_permissions": 0
}
```

---

### `GET /api/staff/permissions/me/`

> Retourne les permissions de l'utilisateur connecté.
>
> `GET /api/staff/permissions/me/`
>
> Returns :
>
> ```json
> {
>   "user": { "id": 1, "username": "test_user" },
>   "employe": { "id": 1, "nom": "Dupont", "prenom": "Jean" },
>   "role": "Manager Salle",
>   "permissions": ["manage_service", "manage_reservations"],
>   "restaurants": [{ "id": 1, "nom": "Les Ombres" }]
> }
> ```

#### Responses

**`200` — `application/json`**

```json
{
  "user": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  },
  "employe": {
    "additionalProp1": "string",
    "additionalProp2": "string",
    "additionalProp3": "string"
  },
  "role": "string",
  "permissions": [
    "string"
  ],
  "restaurants": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ],
  "permission_count": 0,
  "restaurant_count": 0
}
```

**`404` — `application/json`**

```json
{
  "error": "string"
}
```

**`500` — `application/json`**

```json
{
  "error": "string",
  "detail": "string"
}
```

---

### `GET /api/staff/permissions/roles/`

> Retourne la liste de tous les rôles disponibles.
>
> `GET /api/staff/permissions/roles/`
>
> Returns :
>
> ```json
> {
>   "roles": [
>     { "name": "Super Admin Groupe", "value": "Super Admin Groupe", "hierarchy_level": 0 }
>   ]
> }
> ```

#### Responses

**`200` — `application/json`**

```json
{
  "roles": [
    {
      "additionalProp1": "string",
      "additionalProp2": "string",
      "additionalProp3": "string"
    }
  ],
  "count": 0
}
```

---

### `GET /api/staff/permissions/roles/{role_name}/permissions/`

> Retourne les permissions d'un rôle spécifique.
>
> `GET /api/staff/permissions/roles/{role_name}/permissions/`
>
> Args : `role_name` — Le nom du rôle.
>
> Returns :
>
> ```json
> {
>   "role": "Admin Établissement",
>   "permissions": ["manage_establishment", "configure_establishment"]
> }
> ```

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `role_name` | path | string | oui | role_name |

#### Responses

**`200` — `application/json`**

```json
{
  "role": "string",
  "permissions": [
    "string"
  ],
  "count": 0
}
```

**`400` — `application/json`**

```json
{
  "error": "string"
}
```

---

## stocks

### `GET /api/stocks/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `ingredient_id` | query | integer | non | ingredient_id |
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant_id` | query | integer | non | restaurant_id |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "21384837362008",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "ingredient": {
        "id": 0,
        "name": "string",
        "unit": "string",
        "unit_price": "4."
      },
      "quantity_in_stock": "-.53",
      "alert_threshold": "7827799",
      "weighted_average_cost": "-0539."
    }
  ]
}
```

---

### `POST /api/stocks/`

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "ingredient_id": 0,
  "quantity_in_stock": "-592290.525",
  "alert_threshold": "-7602366"
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "97995513908463",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "3806.46"
  },
  "quantity_in_stock": "776269.",
  "alert_threshold": "56656.089",
  "weighted_average_cost": "-11328."
}
```

---

### `GET /api/stocks/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_STOCKS. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "30204821695617",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "710."
  },
  "quantity_in_stock": "088",
  "alert_threshold": "-496",
  "weighted_average_cost": "8179."
}
```

---

### `PUT /api/stocks/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_STOCKS. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "ingredient_id": 0,
  "quantity_in_stock": "-.99",
  "alert_threshold": "-9"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "08970475290278",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "55672579."
  },
  "quantity_in_stock": "-4376",
  "alert_threshold": "6849.5158",
  "weighted_average_cost": "-270"
}
```

---

### `PATCH /api/stocks/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_STOCKS. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "ingredient_id": 0,
  "quantity_in_stock": "-9556",
  "alert_threshold": "-45981.175"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "78208144037317",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "-.88"
  },
  "quantity_in_stock": "-3656668.7924",
  "alert_threshold": "-032358.3",
  "weighted_average_cost": "-8268"
}
```

---

### `DELETE /api/stocks/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_STOCKS. |

#### Responses

**`204`** — No response body.

---

### `POST /api/stocks/{id}/adjust/`

> `POST /api/stocks/{id}/adjust`
> Body : `{"quantite": 10.5, "raison": "Inventaire", "type": "ajout|retrait"}`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_STOCKS. |

#### Request body — `application/json`

```json
{
  "restaurant_id": 0,
  "ingredient_id": 0,
  "quantity_in_stock": "30.3396",
  "alert_threshold": "-7124."
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "71760967286853",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "392999"
  },
  "quantity_in_stock": "-2387451",
  "alert_threshold": "98.4734",
  "weighted_average_cost": "-2310635"
}
```

---

### `GET /api/stocks/alerts/`

> `GET /api/stocks/alerts?restaurant_id=X`

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "78597541296575",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": ".12"
  },
  "quantity_in_stock": "-97.1934",
  "alert_threshold": "96526953",
  "weighted_average_cost": "-2129881."
}
```

---

### `GET /api/stocks/reports/`

> `GET /api/stocks/reports?period=day|week|month|year&restaurant_id=X`

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "38240762585064",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "ingredient": {
    "id": 0,
    "name": "string",
    "unit": "string",
    "unit_price": "5.89"
  },
  "quantity_in_stock": "875",
  "alert_threshold": "-5498",
  "weighted_average_cost": ".31"
}
```

---

## suppliers

### `GET /api/suppliers/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `actif` | query | boolean | non | -- |
| `page` | query | integer | non | A page number within the paginated result set. |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "name": "string",
      "contact_name": "string",
      "email": "user@example.com",
      "telephone": "string",
      "address": "string",
      "city": "string",
      "postal_code": "string",
      "latitude": "19.1481",
      "longitude": "-.06033",
      "notes": "string",
      "is_active": true,
      "jours_livraison": [
        {
          "id": 0,
          "jour": "MONDAY",
          "delivery_time": "12:21:23.406Z"
        }
      ],
      "created_at": "2026-05-05T12:21:23.406Z",
      "updated_at": "2026-05-05T12:21:23.406Z"
    }
  ]
}
```

---

### `POST /api/suppliers/`

#### Request body — `application/json`

```json
{
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "10.068689",
  "longitude": "-132",
  "notes": "string",
  "is_active": true
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "0",
  "longitude": "",
  "notes": "string",
  "is_active": true,
  "jours_livraison": [
    {
      "id": 0,
      "jour": "MONDAY",
      "delivery_time": "12:21:23.412Z"
    }
  ],
  "created_at": "2026-05-05T12:21:23.412Z",
  "updated_at": "2026-05-05T12:21:23.412Z"
}
```

---

### `GET /api/suppliers/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Fournisseur. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "-4.04800",
  "longitude": "-4.93844",
  "notes": "string",
  "is_active": true,
  "jours_livraison": [
    {
      "id": 0,
      "jour": "MONDAY",
      "delivery_time": "12:21:23.414Z"
    }
  ],
  "created_at": "2026-05-05T12:21:23.414Z",
  "updated_at": "2026-05-05T12:21:23.414Z"
}
```

---

### `PUT /api/suppliers/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Fournisseur. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "-012.897179",
  "longitude": "-.3",
  "notes": "string",
  "is_active": true
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "1",
  "longitude": "",
  "notes": "string",
  "is_active": true,
  "jours_livraison": [
    {
      "id": 0,
      "jour": "MONDAY",
      "delivery_time": "12:21:23.424Z"
    }
  ],
  "created_at": "2026-05-05T12:21:23.424Z",
  "updated_at": "2026-05-05T12:21:23.424Z"
}
```

---

### `PATCH /api/suppliers/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Fournisseur. |

#### Request body — `application/json`

```json
{
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "-8",
  "longitude": "-5.9",
  "notes": "string",
  "is_active": true
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "-850.",
  "longitude": "290",
  "notes": "string",
  "is_active": true,
  "jours_livraison": [
    {
      "id": 0,
      "jour": "MONDAY",
      "delivery_time": "12:21:23.431Z"
    }
  ],
  "created_at": "2026-05-05T12:21:23.431Z",
  "updated_at": "2026-05-05T12:21:23.431Z"
}
```

---

### `DELETE /api/suppliers/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Fournisseur. |

#### Responses

**`204`** — No response body.

---

### `GET /api/suppliers/{id}/delivery-days/`

> `GET /api/suppliers/{id}/delivery-days`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Fournisseur. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "name": "string",
  "contact_name": "string",
  "email": "user@example.com",
  "telephone": "string",
  "address": "string",
  "city": "string",
  "postal_code": "string",
  "latitude": "-056.117",
  "longitude": "-",
  "notes": "string",
  "is_active": true,
  "jours_livraison": [
    {
      "id": 0,
      "jour": "MONDAY",
      "delivery_time": "12:21:23.434Z"
    }
  ],
  "created_at": "2026-05-05T12:21:23.434Z",
  "updated_at": "2026-05-05T12:21:23.434Z"
}
```

---

### `GET /api/suppliers/orders/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `fournisseur` | query | integer | non | fournisseur |
| `page` | query | integer | non | A page number within the paginated result set. |
| `restaurant` | query | integer | non | restaurant |
| `statut` | query | string | non | Filtre par statut. Valeurs disponibles : `CANCELLED`, `CONFIRMED`, `DELIVERED`, `DRAFT`, `SENT`. Mapping : `DRAFT` (Brouillon), `SENT` (Envoyée), `CONFIRMED` (Confirmée), `DELIVERED` (Livrée), `CANCELLED` (Annulée). |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "fournisseur": {
        "id": 0,
        "name": "string",
        "contact_name": "string",
        "email": "user@example.com",
        "telephone": "string",
        "address": "string",
        "city": "string",
        "postal_code": "string",
        "latitude": "-.6",
        "longitude": "-2",
        "notes": "string",
        "is_active": true,
        "jours_livraison": [
          {
            "id": 0,
            "jour": "MONDAY",
            "delivery_time": "12:21:23.439Z"
          }
        ],
        "created_at": "2026-05-05T12:21:23.439Z",
        "updated_at": "2026-05-05T12:21:23.439Z"
      },
      "restaurant": {
        "restaurant_id": 0,
        "name": "string",
        "address": "string",
        "postal_code": "string",
        "city": "string",
        "phone_number": "string",
        "siret": "09423434009545",
        "naf_code": "string",
        "pin": "string",
        "logo_url": "string"
      },
      "order_number": "string",
      "order_date": "2026-05-05",
      "expected_delivery_date": "2026-05-05",
      "status": "string",
      "total_amount": "-",
      "notes": "string",
      "created_at": "2026-05-05T12:21:23.439Z",
      "updated_at": "2026-05-05T12:21:23.439Z"
    }
  ]
}
```

---

### `POST /api/suppliers/orders/`

#### Request body — `application/json`

```json
{
  "fournisseur_id": 0,
  "restaurant_id": 0,
  "order_number": "string",
  "order_date": "2026-05-05",
  "expected_delivery_date": "2026-05-05",
  "status": "string",
  "total_amount": ".1",
  "notes": "string"
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "fournisseur": {
    "id": 0,
    "name": "string",
    "contact_name": "string",
    "email": "user@example.com",
    "telephone": "string",
    "address": "string",
    "city": "string",
    "postal_code": "string",
    "latitude": "",
    "longitude": "",
    "notes": "string",
    "is_active": true,
    "jours_livraison": [
      {
        "id": 0,
        "jour": "MONDAY",
        "delivery_time": "12:21:23.446Z"
      }
    ],
    "created_at": "2026-05-05T12:21:23.446Z",
    "updated_at": "2026-05-05T12:21:23.446Z"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "67234113364378",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "order_number": "string",
  "order_date": "2026-05-05",
  "expected_delivery_date": "2026-05-05",
  "status": "string",
  "total_amount": "-0703996",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.446Z",
  "updated_at": "2026-05-05T12:21:23.446Z"
}
```

---

### `GET /api/suppliers/orders/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Commande fournisseur. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "fournisseur": {
    "id": 0,
    "name": "string",
    "contact_name": "string",
    "email": "user@example.com",
    "telephone": "string",
    "address": "string",
    "city": "string",
    "postal_code": "string",
    "latitude": "-",
    "longitude": "-227.658978",
    "notes": "string",
    "is_active": true,
    "jours_livraison": [
      {
        "id": 0,
        "jour": "MONDAY",
        "delivery_time": "12:21:23.448Z"
      }
    ],
    "created_at": "2026-05-05T12:21:23.448Z",
    "updated_at": "2026-05-05T12:21:23.448Z"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "69786199727187",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "order_number": "string",
  "order_date": "2026-05-05",
  "expected_delivery_date": "2026-05-05",
  "status": "string",
  "total_amount": "-35",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.448Z",
  "updated_at": "2026-05-05T12:21:23.448Z"
}
```

---

### `PUT /api/suppliers/orders/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Commande fournisseur. |

#### Request body — `application/json`

```json
{
  "fournisseur_id": 0,
  "restaurant_id": 0,
  "order_number": "string",
  "order_date": "2026-05-05",
  "expected_delivery_date": "2026-05-05",
  "status": "string",
  "total_amount": "6.43",
  "notes": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "fournisseur": {
    "id": 0,
    "name": "string",
    "contact_name": "string",
    "email": "user@example.com",
    "telephone": "string",
    "address": "string",
    "city": "string",
    "postal_code": "string",
    "latitude": ".199968",
    "longitude": "5.394734",
    "notes": "string",
    "is_active": true,
    "jours_livraison": [
      {
        "id": 0,
        "jour": "MONDAY",
        "delivery_time": "12:21:23.456Z"
      }
    ],
    "created_at": "2026-05-05T12:21:23.456Z",
    "updated_at": "2026-05-05T12:21:23.456Z"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "54559475149661",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "order_number": "string",
  "order_date": "2026-05-05",
  "expected_delivery_date": "2026-05-05",
  "status": "string",
  "total_amount": "7564",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.456Z",
  "updated_at": "2026-05-05T12:21:23.456Z"
}
```

---

### `PATCH /api/suppliers/orders/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Commande fournisseur. |

#### Request body — `application/json`

```json
{
  "fournisseur_id": 0,
  "restaurant_id": 0,
  "order_number": "string",
  "order_date": "2026-05-05",
  "expected_delivery_date": "2026-05-05",
  "status": "string",
  "total_amount": "3731286",
  "notes": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "fournisseur": {
    "id": 0,
    "name": "string",
    "contact_name": "string",
    "email": "user@example.com",
    "telephone": "string",
    "address": "string",
    "city": "string",
    "postal_code": "string",
    "latitude": "-9.886",
    "longitude": "6.6",
    "notes": "string",
    "is_active": true,
    "jours_livraison": [
      {
        "id": 0,
        "jour": "MONDAY",
        "delivery_time": "12:21:23.463Z"
      }
    ],
    "created_at": "2026-05-05T12:21:23.463Z",
    "updated_at": "2026-05-05T12:21:23.463Z"
  },
  "restaurant": {
    "restaurant_id": 0,
    "name": "string",
    "address": "string",
    "postal_code": "string",
    "city": "string",
    "phone_number": "string",
    "siret": "21683797193093",
    "naf_code": "string",
    "pin": "string",
    "logo_url": "string"
  },
  "order_number": "string",
  "order_date": "2026-05-05",
  "expected_delivery_date": "2026-05-05",
  "status": "string",
  "total_amount": "-80264281.",
  "notes": "string",
  "created_at": "2026-05-05T12:21:23.463Z",
  "updated_at": "2026-05-05T12:21:23.463Z"
}
```

---

### `DELETE /api/suppliers/orders/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Commande fournisseur. |

#### Responses

**`204`** — No response body.

---

## tables

### `GET /api/tables/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `employee_in_charge_id` | query | integer | non | employee_in_charge_id |
| `page` | query | integer | non | A page number within the paginated result set. |
| `salle_id` | query | integer | non | salle_id |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "numero": 1,
      "capacity": 9223372036854776000,
      "reserved_seats": 9223372036854776000,
      "is_occupied": true,
      "salle": {
        "id": 0,
        "name": "string",
        "restaurant": {
          "restaurant_id": 0,
          "name": "string",
          "address": "string",
          "postal_code": "string",
          "city": "string",
          "phone_number": "string",
          "siret": "08068777556272",
          "naf_code": "string",
          "pin": "string",
          "logo_url": "string"
        },
        "capacity": 0,
        "floor": 0,
        "description": "string"
      },
      "employee_in_charge": {
        "id": 0,
        "user": {
          "id": 0,
          "username": "string",
          "email": "user@example.com",
          "first_name": "string",
          "last_name": "string"
        },
        "last_name": "string",
        "first_name": "string",
        "type_employe": {
          "id": 0,
          "type_name": "string",
          "description": "string"
        },
        "salary": "0.00",
        "hire_date": "2026-05-05",
        "phone_number": "string"
      },
      "salle_id": 0,
      "employee_in_charge_id": 0,
      "position_x": 9223372036854776000,
      "position_y": 9223372036854776000
    }
  ]
}
```

---

### `POST /api/tables/`

#### Request body — `application/json`

```json
{
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "27059293754220",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "employee_in_charge": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

---

### `GET /api/tables/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_TABLES. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "49229832627173",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "employee_in_charge": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

---

### `PUT /api/tables/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_TABLES. |

#### Request body — `application/json`

```json
{
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "82964902077089",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "employee_in_charge": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

---

### `PATCH /api/tables/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_TABLES. |

#### Request body — `application/json`

```json
{
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "05013571347241",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "employee_in_charge": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

---

### `DELETE /api/tables/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this T_HOLLY_PI_TABLES. |

#### Responses

**`204`** — No response body.

---

### `GET /api/tables/status/`

> `GET /api/tables/status?date=YYYY-MM-DD&service=midi|soir&restaurant_id=X`

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "numero": 1,
  "capacity": 9223372036854776000,
  "reserved_seats": 9223372036854776000,
  "is_occupied": true,
  "salle": {
    "id": 0,
    "name": "string",
    "restaurant": {
      "restaurant_id": 0,
      "name": "string",
      "address": "string",
      "postal_code": "string",
      "city": "string",
      "phone_number": "string",
      "siret": "56286494278299",
      "naf_code": "string",
      "pin": "string",
      "logo_url": "string"
    },
    "capacity": 0,
    "floor": 0,
    "description": "string"
  },
  "employee_in_charge": {
    "id": 0,
    "user": {
      "id": 0,
      "username": "string",
      "email": "user@example.com",
      "first_name": "string",
      "last_name": "string"
    },
    "last_name": "string",
    "first_name": "string",
    "type_employe": {
      "id": 0,
      "type_name": "string",
      "description": "string"
    },
    "salary": "0.00",
    "hire_date": "2026-05-05",
    "phone_number": "string"
  },
  "salle_id": 0,
  "employee_in_charge_id": 0,
  "position_x": 9223372036854776000,
  "position_y": 9223372036854776000
}
```

---

## type-employes

> ViewSet pour gérer les types d'employés.

### `GET /api/type-employes/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `nom_type` | query | string | non | nom_type |
| `page` | query | integer | non | A page number within the paginated result set. |

#### Responses

**`200` — `application/json`**

```json
{
  "count": 123,
  "next": "http://api.example.org/accounts/?page=4",
  "previous": "http://api.example.org/accounts/?page=2",
  "results": [
    {
      "id": 0,
      "type_name": "string",
      "description": "string"
    }
  ]
}
```

---

### `POST /api/type-employes/`

#### Request body — `application/json`

```json
{
  "type_name": "string",
  "description": "string"
}
```

#### Responses

**`201` — `application/json`**

```json
{
  "id": 0,
  "type_name": "string",
  "description": "string"
}
```

---

### `GET /api/type-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Type d'employé. |

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "type_name": "string",
  "description": "string"
}
```

---

### `PUT /api/type-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Type d'employé. |

#### Request body — `application/json`

```json
{
  "type_name": "string",
  "description": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "type_name": "string",
  "description": "string"
}
```

---

### `PATCH /api/type-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Type d'employé. |

#### Request body — `application/json`

```json
{
  "type_name": "string",
  "description": "string"
}
```

#### Responses

**`200` — `application/json`**

```json
{
  "id": 0,
  "type_name": "string",
  "description": "string"
}
```

---

### `DELETE /api/type-employes/{id}/`

#### Parameters

| Name | In | Type | Required | Description |
|---|---|---|---|---|
| `id` | path | integer | oui | A unique integer value identifying this Type d'employé. |

#### Responses

**`204`** — No response body.

---

## csrf

### `GET /csrf/`

> Récupération du token CSRF. Aucune authentification utilisateur requise.

#### Responses

**`200` — `application/json`**

```json
{
  "csrfToken": "string"
}
```

---

## Schemas

La spécification OpenAPI source liste les schémas suivants. Leur définition détaillée n'est pas exposée dans la spec source ; seuls les noms (composants `#/components/schemas/...`) sont énumérés.

- AllPermissionsResponse
- AllRolesResponse
- Article
- ArticleDetail
- ArticleDetailRequest
- ArticleIngredient
- ArticleIngredientRequest
- ArticleRequest
- BillingSettings
- BillingSettingsRequest
- CategorieArticle
- CategorieArticleRequest
- CheckMultiplePermissionsError
- CheckMultiplePermissionsRequestRequest
- CheckMultiplePermissionsResponse
- CheckMultiplePermissionsServerError
- CheckPermissionError
- CheckPermissionRequestRequest
- CheckPermissionResponse
- CheckPermissionServerError
- Commande
- CommandeFournisseur
- CommandeFournisseurRequest
- CommandeRequest
- CompareRolesError
- CompareRolesRequestRequest
- CompareRolesResponse
- CsrfTokenResponse
- DashboardKPIsError
- DashboardKPIsNotFound
- DashboardKPIsResponse
- DashboardMapResponse
- DeleteAccountResponse
- DeleteAccountUnauthorized
- DeviceLoginRequest
- DeviceLoginResponse
- DeviceLoginValidationErrors
- EmailPasswordLoginRequest
- EmploiCreneau
- EmploiDuTempsError
- EmploiDuTempsNotFound
- EmploiDuTempsResponse
- EmploiDuTempsUnauthorized
- EmploiJour
- EmploiRestaurant
- EmploiSemaine
- Employe
- EmployeRequest
- EmployeesStatusError
- EmployeesStatusResponse
- Facture
- FactureRequest
- Fournisseur
- FournisseurRequest
- HealthCheckResponse
- Ingredient
- IngredientRequest
- JourEnum
- JourLivraison
- JourLivraisonRequest
- LigneCommande
- LigneCommandeRequest
- LigneFacture
- LigneFactureRequest
- LoginResponse
- LoginValidationErrors
- LogoutResponse
- MFAConfirmError
- MFAConfirmRequest
- MFAConfirmSuccess
- MFADisableError
- MFADisableRequest
- MFADisableSuccess
- MFASetupError
- MFASetupResponse
- MFAStatusResponse
- MethodePaiement
- MethodePaiementRequest
- MyPermissionsNotFound
- MyPermissionsResponse
- MyPermissionsServerError
- Note
- NoteRequest
- NotificationSettings
- NotificationSettingsRequest
- PaginatedArticleDetailList
- PaginatedArticleIngredientList
- PaginatedBillingSettingsList
- PaginatedCategorieArticleList
- PaginatedCommandeFournisseurList
- PaginatedCommandeList
- PaginatedEmployeList
- PaginatedFactureList
- PaginatedFournisseurList
- PaginatedIngredientList
- PaginatedLigneCommandeList
- PaginatedMethodePaiementList
- PaginatedNoteList
- PaginatedNotificationSettingsList
- PaginatedPaiementList
- PaginatedReapprovisionnementList
- PaginatedReportList
- PaginatedReservationList
- PaginatedRestaurantEmployeList
- PaginatedRestaurantList
- PaginatedSalleList
- PaginatedShiftList
- PaginatedStockList
- PaginatedTableList
- PaginatedTypeEmployeList
- Paiement
- PaiementRequest
- PatchedArticleDetailRequest
- PatchedArticleIngredientRequest
- PatchedBillingSettingsRequest
- PatchedCategorieArticleRequest
- PatchedCommandeFournisseurRequest
- PatchedCommandeRequest
- PatchedEmployeRequest
- PatchedFactureRequest
- PatchedFournisseurRequest
- PatchedIngredientRequest
- PatchedLigneCommandeRequest
- PatchedNoteRequest
- PatchedNotificationSettingsRequest
- PatchedPaiementRequest
- PatchedReapprovisionnementRequest
- PatchedReportRequest
- PatchedReservationRequest
- PatchedRestaurantEmployeRequest
- PatchedRestaurantRequest
- PatchedSalleRequest
- PatchedShiftRequest
- PatchedStockRequest
- PatchedTableRequest
- PatchedTypeEmployeRequest
- PatchedUserProfileRequest
- PermissionMatrixResponse
- PermissionRolesError
- PermissionRolesResponse
- ProfileDeleteResponse
- ProfileUpdateResponse
- ProfileUpdateValidationErrors
- QuickLoginRequest
- QuickLoginResponse
- QuickLoginValidationErrors
- Reapprovisionnement
- ReapprovisionnementRequest
- RegistrationErrors
- RegistrationSuccess
- Report
- ReportRequest
- Reservation
- ReservationRequest
- Restaurant
- RestaurantEmploye
- RestaurantEmployeRequest
- RestaurantEmployeesError
- RestaurantEmployeesResponse
- RestaurantEmployeesUnauthorized
- RestaurantRequest
- RoleHierarchyResponse
- RolePermissionsError
- RolePermissionsResponse
- Salle
- SalleRequest
- Shift
- ShiftRequest
- Stock
- StockRequest
- Table
- TableRequest
- TokenRefresh
- TokenRefreshRequest
- TypeEmploye
- TypeEmployeRequest
- UserBasic
- UserProfile
- UserRegistrationRequest
- VerifyMFAError
- VerifyMFARequest
- VerifyMFASuccess
- VerifyMFAUnauthorized
