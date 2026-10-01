<?php
/**
 * PharmOS Enterprise - Authentication & Role-Based Access Control Middleware
 */

declare(strict_types=1);

namespace PharmOS\Middleware;

use RuntimeException;

class AuthMiddleware
{
    public static function checkAuthenticated(): array
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($_SESSION['user_id']) || empty($_SESSION['role'])) {
            http_response_code(401);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Unauthorized: Please authenticate.']);
            exit;
        }

        return [
            'user_id' => (int)$_SESSION['user_id'],
            'role' => (string)$_SESSION['role'],
            'name' => (string)$_SESSION['user_name']
        ];
    }

    public static function requireRoles(array $allowedRoles): array
    {
        $user = self::checkAuthenticated();

        if (!in_array($user['role'], $allowedRoles, true)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode([
                'success' => false,
                'error' => "Forbidden: Role '{$user['role']}' does not have permission to execute this operation."
            ]);
            exit;
        }

        return $user;
    }

    public static function validateCsrfToken(?string $token): void
    {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        if (empty($token) || empty($_SESSION['csrf_token']) || !hash_equals($_SESSION['csrf_token'], $token)) {
            http_response_code(403);
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Invalid CSRF token. Operation aborted.']);
            exit;
        }
    }
}
