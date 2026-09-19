<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Réinitialisation de votre mot de passe — NAWO</title>
</head>
<body style="margin:0;background:#faf7ff;color:#292235;font-family:Arial,sans-serif;line-height:1.6;">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
        <div style="background:#ffffff;border:1px solid #eee8f6;border-radius:20px;padding:36px 32px;">
            <div style="color:#7c3aed;font-size:24px;font-weight:800;letter-spacing:.08em;">NAWO</div>
            <h1 style="margin:32px 0 12px;font-size:25px;line-height:1.25;">Réinitialiser votre mot de passe</h1>
            <p>Bonjour{{ $user->full_name ? ' '.$user->full_name : '' }},</p>
            <p>Nous avons reçu une demande de réinitialisation du mot de passe de votre compte NAWO.</p>
            <p>Pour choisir un nouveau mot de passe, <a href="{{ $url }}" style="color:#7c3aed;font-weight:700;text-decoration:none;">cliquez ici</a>.</p>
            <p>Ce lien expirera dans {{ $expires }} minutes.</p>
            <p>Si vous n’êtes pas à l’origine de cette demande, aucune action n’est nécessaire.</p>
            <p style="margin-top:28px;">À bientôt,<br><strong>L’équipe NAWO</strong></p>
        </div>
    </div>
</body>
</html>
