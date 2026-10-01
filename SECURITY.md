# Security Architecture & Hardening Standards

PharmOS Enterprise enforces defense-in-depth security principles across transport, application runtime, and database tiers.

## 1. Password Hashing & Authentication
* **Algorithm**: PHP native `password_hash($password, PASSWORD_BCRYPT, ['cost' => 12])`.
* Plaintext passwords are never stored in memory or written to disk.
* Authentication verification uses `password_verify()` with timing-attack mitigation.

## 2. SQL Injection Prevention
* **Zero Raw Concatenation**: Every SQL query is parameterized using PDO native prepared statements:
  ```php
  $pdo->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
  $stmt = $pdo->prepare("SELECT * FROM medicines WHERE id = :id");
  $stmt->execute([':id' => $id]);
  ```
* Emulated prepares are explicitly disabled to guarantee the MySQL server compiles query syntax and data parameters in separate execution phases.

## 3. Cross-Site Scripting (XSS) Prevention
* Output escaping via `htmlspecialchars($val, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8')`.
* Strict Content Security Policy headers preventing unauthorized script execution.
* JSON responses served with explicit `Content-Type: application/json; charset=utf-8`.

## 4. Cross-Site Request Forgery (CSRF)
* Synchronizer Token Pattern: Unique cryptographically secure CSRF token generated per session (`bin2hex(random_bytes(32))`).
* Validated with `hash_equals()` on state-altering requests (POST, PUT, DELETE).

## 5. Role-Based Access Control (RBAC)
* Permissions are enforced at the server controller/service boundary, not merely by hiding UI buttons.
* If a Cashier attempts to call an inventory adjustment endpoint or delete records, the server returns an HTTP 403 Forbidden with audit logging.

## 6. Audit Logging & Non-Repudiation
* Critical operations write an immutable record to `audit_logs` containing timestamp, operator ID, action name, target entity, and IP address.
