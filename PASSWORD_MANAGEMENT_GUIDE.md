# Guía: Gestión de Contraseñas en Auth Service

## 📌 Resumen Ejecutivo

**Recomendación:** Usar el modelo actual de **Admin Reset** con transición a **Self-Service OTP** en mediano plazo.

---

## 1. Modelo Actual: Admin Reset (Implementado)

### Cómo Funciona

1. Usuario olvida contraseña
2. Contacta al Admin/Soporte
3. Admin ejecuta: `POST /api/auth/users/reset-password`
4. Usuario recibe password temporal vía comunicación segura (no por email)
5. En el siguiente login, debe cambiar la contraseña obligatoriamente

### Ventajas ✅

| Ventaja | Beneficio |
|---------|-----------|
| **Seguridad Alta** | Admin elige password fuerte, no el usuario |
| **Auditable** | Se registra quién reseteó y cuándo |
| **Anti-phishing** | No hay links en email que puedan ser suplantados |
| **Soporte Directo** | El usuario confirma su identidad con el admin |
| **Prevención de Account Takeover** | Reset requiere validación de identity |

### Desventajas ❌

| Desventaja | Impacto |
|-----------|---------|
| **Latencia** | El usuario espera a que admin resete |
| **Carga Operacional** | Admin/Soporte recibe muchos requests |
| **Pobre UX** | No es autoservicio |

### Casos de Uso

- Empresas pequeñas (< 100 usuarios)
- Sistemas críticos con alta seguridad
- Equipos donde el soporte puede responder rápido

---

## 2. Alternativa: Self-Service Password Recovery

### Cómo Funciona

1. Usuario accede a `/api/auth/forgot-password`
2. Ingresa su email
3. Sistema envía link con token de recuperación (5-10 min de validez)
4. Usuario hace click en link → comprueba identidad
5. Ingresa nueva contraseña
6. Token se consume (no reutilizable)

### Implementación Propuesta

**Endpoint 1: Solicitar recuperación**
```typescript
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

Response (200):
{
  "message": "Instrucciones de recuperación enviadas a email"
}
```

**En Redis:**
```
recovery:tokens:{hashedEmail} = {
  token: "unique-token-xyz",
  expiresAt: 1774410000,
  attempts: 0
}
```

**Endpoint 2: Validar y cambiar contraseña**
```typescript
POST /api/auth/reset-password-confirm
{
  "token": "unique-token-xyz",
  "newPassword": "SecureNew123!"
}

Response (200):
{
  "message": "Contraseña actualizada exitosamente"
}
```

### Flujo de Seguridad

```
┌─────────────────────────────────────┐
│ 1. Usuario solicita recuperación    │
│    POST /forgot-password            │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 2. Token guardado en Redis (5 min)  │
│    + Detalles en log para auditoría │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 3. Email enviado con link seguro    │
│    (SOLO si es verificado HTTPS)    │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 4. Usuario hace click (expira si no)│
│    Token validado contra Redis      │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 5. Nueva contraseña ingresada       │
│    Password hash + token consumido  │
└──────────────┬──────────────────────┘
               ↓
┌─────────────────────────────────────┐
│ 6. Email de confirmación enviado    │
│    (opcional, pero recomendado)     │
└─────────────────────────────────────┘
```

### Ventajas ✅

- Mejor UX (autoservicio)
- Reduce carga en soporte
- Token temporal + único reduce riesgo
- Auditable con logs

### Desventajas ❌

- Requiere servidor de email/SMS
- Links pueden ser interceptados (mitigable con HTTPS)
- Usuarios pueden ignorar expiraciones

---

## 3. Alternativa Avanzada: OTP + SMS/Email

### Cómo Funciona

1. Usuario solicita reset → verifica email único
2. Sistema genera OTP de 6 dígitos
3. OTP se envía por SMS o email (recomendado: SMS)
4. Usuario ingresa OTP en app
5. Si válido, puede cambiar contraseña

### Ventajas ✅

- Más seguro que links (no interceptables por URL)
- SMS es más seguro que email
- OTP típicamente 60 segundos de validez
- Estándar TOTP/HOTP

### Desventajas ❌

- Requiere integración con Twilio/AWS SNS
- Costo por SMS (∼$0.01 por mensaje)
- No funciona sin número de teléfono

---

## 4. Modelo Recomendado para Tu Proyecto (Fases)

### Fase 1: Hoy (Ya Implementado)
**Admin Reset** manualmente
- Seguro y simple
- Mientras tienes pocos usuarios

### Fase 2: Próximo Sprint (Corto Plazo)
**Self-Service con Token**
```typescript
// En AuthService
async forgotPassword(email: string): Promise<{ message: string }> {
  const token = this.generateSecureToken();
  const hashedToken = this.hashToken(token);
  
  await this.redisService.set(
    `recovery:${email}`,
    hashedToken,
    300  // 5 minutos
  );
  
  // Enviar email con token (integrar MailerModule)
  // await this.mailerService.send(email, token);
  
  return { message: 'Instrucciones enviadas a tu email' };
}
```

### Fase 3: Mediano Plazo
**Agregar validación OTP**
- Si integras Twilio, proteger contra enumeración de usuarios
- Rate limiting: máximo 3 intentos por IP por minuto

---

## 5. Mejores Prácticas de Seguridad

### Reglas de Validación de Contraseña

```typescript
// Mínimo recomendado
MIN_LENGTH = 12
MUST_HAVE = [
  /[A-Z]/,      // Mayúsula
  /[a-z]/,      // Minúscula
  /\d/,         // Número
  /[!@#$%^&*]/  // Caracter especial
]
```

### Protecciones Contra Fuerza Bruta

```typescript
// En AuthService
private readonly maxLoginAttempts = 5;
private readonly lockoutDurationMs = 15 * 60 * 1000; // 15 min

async login(dto: LoginDto) {
  const attempts = await this.redisService.get(`login:attempts:${dto.email}`);
  
  if (attempts && parseInt(attempts) >= this.maxLoginAttempts) {
    throw new TooManyRequestsException(
      'Cuenta bloqueada temporalmente. Intenta en 15 minutos.'
    );
  }
  
  // ... validar credenciales ...
  
  // Si falla, incrementar contador
  await this.redisService.incr(`login:attempts:${dto.email}`, 900); // 15 min TTL
}
```

### Almacenamiento en Base de Datos

❌ **NO HAGAS:**
```typescript
// RIESGO CRÍTICO: Contraseña en texto plano
{ email: 'user@example.com', password: 'P@ssw0rd!' }
```

✅ **HAZLO SIEMPRE:**
```typescript
import * as bcrypt from 'bcrypt';

// En repositorio
const hashedPassword = await bcrypt.hash(password, 10);
await db.users.insert({ email, password: hashedPassword });

// Validación en auth.service
const isValid = await bcrypt.compare(inputPassword, user.password);
```

### Auditoría y Logging

```typescript
// Guardar eventos sensibles en Redis
async resetPassword(email: string, admin: string) {
  await this.redisService.set(
    `audit:password:reset:${email}`,
    JSON.stringify({
      timestamp: new Date(),
      admin,
      reason: 'admin-reset-requested'
    }),
    86400 * 30  // 30 días de histórico
  );
}
```

---

## 6. Tabla Comparativa: Qué Elegir

| Criterio | Admin Reset | Self-Service Token | OTP SMS |
|----------|-------------|-------------------|---------|
| **Seguridad** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **UX** | ⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Costo** | Bajo | Bajo (email) | Alto (SMS) |
| **Complejidad** | ⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Para < 100 users** | ✅ Excelente | ⚠️ Opcional | ❌ Overkill |
| **Para 100-1000 users** | ⚠️ Moderado | ✅ Recomendado | ⭐ Mejor |
| **Para > 1000 users** | ❌ Insostenible | ⚠️ Aceptable | ✅ Ideal |

---

## 7. Pasos Siguientes

### Ahora (Prod-Ready)
- [x] Admin reset implementado
- [ ] Agregar rate limiting en login
- [ ] Implementar bcrypt en almacenamiento real

### Próxima Sprint
- [ ] Endpoint `/api/auth/forgot-password`
- [ ] Integración con MailerModule (@nestjs-modules/mailer)
- [ ] Token de recuperación con hash seguro

### Futuro (si escalas a 1000+ usuarios)
- [ ] Integración Twilio OTP
- [ ] 2FA/MFA obligatorio para admins
- [ ] WebAuthn (biometría/yubikey)

---

## 📞 Soporte y Contacto

Para consultas sobre arquitectura de autenticación, contactar al arqutieccto de software del proyecto.

---

**Documento versión:** 1.0  
**Última actualización:** Marzo 2026
