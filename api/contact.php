<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('X-Content-Type-Options: nosniff');

function respond(int $status, array $data): never
{
    http_response_code($status);
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE | JSON_INVALID_UTF8_SUBSTITUTE
    );
    exit;
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    respond(405, [
        'ok' => false,
        'message' => 'Only POST requests are allowed.'
    ]);
}

$contentType = strtolower(trim(
    explode(';', $_SERVER['CONTENT_TYPE'] ?? '')[0]
));

if ($contentType !== 'application/json') {
    respond(415, [
        'ok' => false,
        'message' => 'Content-Type must be application/json.'
    ]);
}

if ((int)($_SERVER['CONTENT_LENGTH'] ?? 0) > 40000) {
    respond(413, [
        'ok' => false,
        'message' => 'Request is too large.'
    ]);
}

$raw = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!is_array($data)) {
    respond(400, [
        'ok' => false,
        'message' => 'Invalid request data.'
    ]);
}

$name = $data['name'] ?? '';
$email = $data['email'] ?? '';
$subject = $data['subject'] ?? '';
$message = $data['message'] ?? '';

foreach ([$name, $email, $subject, $message] as $value) {
    if (!is_string($value)) {
        respond(422, [
            'ok' => false,
            'message' => 'Invalid form data.'
        ]);
    }
}

$name = trim($name);
$email = trim($email);
$subject = trim($subject);
$message = trim($message);

if (
    $name === '' ||
    mb_strlen($name) > 100 ||
    mb_strlen($email) > 254 ||
    mb_strlen($subject) > 200 ||
    $message === '' ||
    mb_strlen($message) > 5000 ||
    !filter_var($email, FILTER_VALIDATE_EMAIL)
) {
    respond(422, [
        'ok' => false,
        'message' => 'Please check the form fields.'
    ]);
}

try {
    require_once dirname(__DIR__, 2) . '/private/db.php';

    $sql = 'INSERT INTO contact_messages
            (name, email, subject, message)
            VALUES
            (:name, :email, :subject, :message)';

    $stmt = $pdo->prepare($sql);

    $stmt->execute([
        'name' => $name,
        'email' => $email,
        'subject' => $subject !== '' ? $subject : null,
        'message' => $message,
    ]);

    respond(201, [
        'ok' => true,
        'message' => 'Your message was saved successfully.'
    ]);

} catch (Throwable $e) {
    error_log('Contact API error: ' . $e->getMessage());

    respond(500, [
        'ok' => false,
        'message' => 'Unable to save your message at this time.'
    ]);
}