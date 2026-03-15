# Authentication API Documentation

This app manages restaurant device authentication and employee quick login using PIN codes and JWT (JSON Web Tokens).

## Base URL
All endpoints are prefixed with `/api/auth/`

## Authentication System

This API uses a **2-step authentication system** designed for restaurant tablet devices:

### 🔐 Step 1: Device Login (One-time setup)
Connect a tablet/iPad to a specific restaurant using the restaurant's credentials.

### 👤 Step 2: Quick Login (Per shift)
Employees quickly log in using their 4-digit PIN code on an already-configured device.

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    First Time Setup                         │
│                                                               │
│  1. Install app on iPad                                      │
│  2. POST /api/auth/device-login/                             │
│     → Restaurant ID + PIN Restaurant (6 digits)              │
│     → Receive device_token (stored locally, 30 days)         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    Daily Employee Login                      │
│                                                               │
│  1. Employee arrives for shift                               │
│  2. POST /api/auth/quick-login/                              │
│     → device_token + Employee PIN (4 digits)                 │
│     → Receive JWT access_token + refresh_token               │
└─────────────────────────────────────────────────────────────┘
```

### MFA (authentification à deux facteurs — TOTP)

Pour les connexions **username/password** (`POST /api/auth/login/`), un utilisateur peut activer le MFA (code à 6 chiffres type Google Authenticator).

- **Activation** : après connexion, `POST /api/auth/mfa/setup/` → reçoit `secret` et `otpauth_url` (pour flasher le QR dans une app TOTP). Puis `POST /api/auth/mfa/confirm/` avec `{"code": "123456"}` pour activer.
- **Login avec MFA** : `POST /api/auth/login/` renvoie alors `requires_mfa: true` et `temp_token` (pas de JWT). Le client envoie `POST /api/auth/verify-mfa/` avec `{"temp_token": "...", "code": "123456"}` et reçoit les tokens JWT.
- **Désactivation** : `POST /api/auth/mfa/disable/` avec `{"password": "..."}`.
- **Statut** : `GET /api/auth/mfa/status/` → `{"mfa_enabled": true/false}`.

Le profil utilisateur (`GET /api/auth/profile/`) inclut `mfa_enabled` en lecture seule.

---

## Endpoints

### 1. Device Login (Restaurant Configuration)

**Endpoint:** `POST /api/auth/device-login/`

**Description:** Connect a device (iPad/tablet) to a specific restaurant. This is done once when setting up a new device.

**Authentication Required:** No

**Request Body:**
```json
{
  "restaurant_id": 1,
  "pin_restaurant": "880767"
}
```

**Required Fields:**
- `restaurant_id` (integer): The unique ID of the restaurant
- `pin_restaurant` (string): 6-digit PIN code for the restaurant

**Success Response:**
```json
{
  "message": "Équipement connecté au restaurant avec succès",
  "device_token": "abc123xyz789...",
  "restaurant_id": 1,
  "restaurant_name": "Big C",
  "restaurant_ville": "Paris",
  "next_step": "quick_login"
}
```

**HTTP Status Codes:**
- `200 OK`: Device connected successfully
- `400 Bad Request`: Invalid restaurant ID or PIN

**Error Response Examples:**
```json
{
  "non_field_errors": [
    "Restaurant introuvable."
  ]
}
```

```json
{
  "non_field_errors": [
    "PIN restaurant incorrect."
  ]
}
```

**Important:**
- The `device_token` should be stored securely on the device (local storage, secure keychain)
- Token expires after 30 days - device will need to be reconfigured
- Each restaurant has a unique 6-digit PIN for device registration

---

### 2. Quick Login (Employee Authentication)

**Endpoint:** `POST /api/auth/quick-login/`

**Description:** Fast employee login using their personal 4-digit PIN code on a configured device.

**Authentication Required:** No (but requires valid device_token)

**Request Body:**
```json
{
  "device_token": "abc123xyz789...",
  "pin_code": "8961"
}
```

**Required Fields:**
- `device_token` (string): The device token from device-login
- `pin_code` (string): Employee's 4-digit PIN code

**Success Response:**
```json
{
  "message": "Connexion réussie",
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "refresh_token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "user_id": 42,
  "username": "byron.brazeau",
  "employee_id": 15,
  "employee_name": "Byron Brazeau",
  "employee_first_name": "Byron",
  "employee_last_name": "Brazeau",
  "employee_type": "Serveur",
  "employee_type_id": 2,
  "restaurant_id": 1,
  "restaurant_name": "Big C"
}
```

**HTTP Status Codes:**
- `200 OK`: Login successful
- `400 Bad Request`: Invalid PIN or device not configured

**Error Response Examples:**
```json
{
  "non_field_errors": [
    "Équipement non configuré ou session expirée. Veuillez reconnecter l'équipement."
  ]
}
```

```json
{
  "non_field_errors": [
    "Code PIN incorrect ou employé introuvable dans ce restaurant."
  ]
}
```

**Important:**
- PIN codes are unique per restaurant (two employees in different restaurants can have the same PIN)
- The access_token should be included in subsequent API requests
- Tokens expire - use refresh token to get new access token

---

### 3. User Registration

**Endpoint:** `POST /api/auth/register/`

**Description:** Register a new employee account with restaurant association.

**Authentication Required:** No

**Request Body:**
```json
{
  "username": "john_doe",
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "password2": "SecurePassword123!",
  "first_name": "John",
  "last_name": "Doe",
  "nom": "Doe",
  "prenom": "John",
  "pin_code": "1234",
  "type_employe_id": 2,
  "restaurant_id": 1
}
```

**Required Fields:**
- `username` (string): Unique username
- `email` (string): Valid email address (unique)
- `password` (string): Password meeting validation requirements
- `password2` (string): Password confirmation
- `nom` (string): Employee last name
- `prenom` (string): Employee first name
- `pin_code` (string): 4-digit PIN code (unique per restaurant)
- `type_employe_id` (integer): Employee type ID (Manager, Serveur, Cuisinier, etc.)
- `restaurant_id` (integer): Restaurant ID to associate with

**Success Response:**
```json
{
  "message": "Utilisateur créé avec succès. Veuillez vérifier votre PIN.",
  "id_user": 42,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "verification_token": "xyz789abc123...",
  "next_step": "verify_pin",
  "employee_id": 15,
  "employee_name": "John Doe",
  "employee_first_name": "John",
  "employee_last_name": "Doe",
  "employee_type": "Serveur",
  "employee_type_id": 2
}
```

**HTTP Status Codes:**
- `201 Created`: User registered successfully
- `400 Bad Request`: Validation error

---

### 4. Refresh Access Token

**Endpoint:** `POST /api/auth/token/refresh/`

**Description:** Obtain a new access token using a refresh token.

**Authentication Required:** No (but requires valid refresh token)

**Request Body:**
```json
{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**Success Response:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGc..."
}
```

**HTTP Status Codes:**
- `200 OK`: New access token generated
- `401 Unauthorized`: Invalid or expired refresh token

---

### 5. User Logout

**Endpoint:** `POST /api/auth/logout/`

**Description:** Log out the current user.

**Authentication Required:** No

**Success Response:**
```json
{
  "message": "Déconnexion réussie"
}
```

**HTTP Status Code:** `200 OK`

---

### 6. Get User Profile

**Endpoint:** `GET /api/auth/profile/`

**Description:** Retrieve the profile of the currently authenticated user.

**Authentication Required:** Yes

**Request Headers:**
```
Authorization: Bearer <your_access_token>
```

**Success Response:**
```json
{
  "id": 42,
  "username": "john_doe",
  "email": "john.doe@example.com",
  "first_name": "John",
  "last_name": "Doe",
  "date_joined": "2025-01-15T10:30:00Z",
  "is_active": true,
  "employee_id": 15,
  "employee_name": "John Doe",
  "employee_first_name": "John",
  "employee_last_name": "Doe",
  "employee_type": "Serveur",
  "employee_type_id": 2
}
```

**HTTP Status Codes:**
- `200 OK`: Profile retrieved successfully
- `401 Unauthorized`: Not authenticated

---

### 7. Get CSRF Token

**Endpoint:** `GET /api/auth/csrf-token/`

**Description:** Retrieve a CSRF token for form submissions.

**Success Response:**
```json
{
  "csrfToken": "abc123def456..."
}
```

**HTTP Status Code:** `200 OK`

---

## JWT Token Usage

### Including Tokens in Requests

For all protected endpoints, include the access token in the Authorization header:

```http
GET /api/commandes/ HTTP/1.1
Authorization: Bearer eyJ0eXAiOiJKV1QiLCJhbGc...
```

### Token Expiration

- **Access Token:** 60 minutes
- **Refresh Token:** 1 day
- **Device Token:** 30 days

### Token Refresh Flow

1. Client receives both tokens upon quick-login
2. Client uses access token for API requests
3. When access token expires (401 response), use refresh token to get new access token
4. If refresh token expires, employee must log in again with their PIN

---

## PIN Code System

### Restaurant PIN (6 digits)
- Used for device registration
- Each restaurant has a unique PIN
- Should be kept secure and only shared with authorized personnel
- Example: `880767`

### Employee PIN (4 digits)
- Used for quick login on configured devices
- Unique per restaurant (not globally unique)
- Two employees in different restaurants can have the same PIN
- Example: `8961`

### PIN Security
- PINs are validated server-side
- Failed login attempts should be logged
- Consider implementing rate limiting for PIN attempts

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "field_name": [
    "Error message describing the validation error."
  ]
}
```

**401 Unauthorized**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

**Token Expired**
```json
{
  "detail": "Given token not valid for any token type",
  "code": "token_not_valid"
}
```

---

## Integration Example (Mobile App)

### Initial Setup Flow
```typescript
// 1. Configure device on first launch
const setupDevice = async (restaurantId: number, pinRestaurant: string) => {
  const response = await fetch('/api/auth/device-login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ restaurant_id: restaurantId, pin_restaurant: pinRestaurant })
  });
  
  const data = await response.json();
  
  // Store device_token locally (AsyncStorage, SecureStore, etc.)
  await SecureStore.setItemAsync('device_token', data.device_token);
  await SecureStore.setItemAsync('restaurant_id', data.restaurant_id.toString());
  
  return data;
};

// 2. Employee login
const employeeLogin = async (pinCode: string) => {
  const deviceToken = await SecureStore.getItemAsync('device_token');
  
  const response = await fetch('/api/auth/quick-login/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ device_token: deviceToken, pin_code: pinCode })
  });
  
  const data = await response.json();
  
  // Store JWT tokens
  await SecureStore.setItemAsync('access_token', data.access_token);
  await SecureStore.setItemAsync('refresh_token', data.refresh_token);
  
  return data;
};

// 3. Make authenticated requests
const fetchOrders = async () => {
  const accessToken = await SecureStore.getItemAsync('access_token');
  
  const response = await fetch('/api/commandes/', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  });
  
  return await response.json();
};
```

---

## Security Best Practices

1. **Device Token Storage:**
   - Store device tokens in secure storage (Keychain on iOS, Keystore on Android)
   - Never expose tokens in logs or error messages

2. **PIN Entry:**
   - Use numeric keypad for PIN entry
   - Mask PIN input (show dots instead of numbers)
   - Clear PIN input after failed attempt

3. **Token Management:**
   - Implement automatic token refresh
   - Clear tokens on logout
   - Handle token expiration gracefully

4. **HTTPS:**
   - Always use HTTPS in production
   - Implement certificate pinning for enhanced security

5. **Device Security:**
   - Implement device lock/auto-logout after inactivity
   - Consider biometric authentication as an additional layer

6. **Audit:**
   - Log all login attempts (successful and failed)
   - Monitor suspicious PIN entry patterns
   - Alert on multiple failed attempts

---

## Testing Data

For development/testing, use the `generate_fake_data` management command to create test restaurants and employees:

```bash
python manage.py generate_fake_data --confirm
```

This will create:
- 15 restaurants with unique 6-digit PINs
- 100+ employees with unique 4-digit PINs per restaurant
- All necessary related data (tables, orders, inventory, etc.)

Example test data:
```
Restaurant: Big C
  ID: 1
  PIN Restaurant: 880767
  Employees:
    - Byron Brazeau: PIN 8961
    - Romain Nantel: PIN 4515
    - Louison Perras: PIN 4014
```

**Connexion web (email + mot de passe)**  
L’authentification se fait uniquement par **email** (pas par username). Après génération des données factices, utilisez :

- **root** : `root@hollypi.com` / `root`
- **test Les Ombres** : `test@lesombres.com` / `Test1234!`
- **Employés aléatoires** : mot de passe `Password123!` — l’email est affiché en fin de script (ex. `...@hollypi.com`).

---
