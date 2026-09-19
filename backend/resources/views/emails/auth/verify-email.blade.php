<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Confirmez votre adresse email — NAWO</title>
</head>
<body style="margin:0;background:#faf7ff;color:#292235;font-family:Arial,sans-serif;line-height:1.6;">
    <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
        <div style="background:#ffffff;border:1px solid #eee8f6;border-radius:20px;padding:36px 32px;">
            <div style="color:#7c3aed;font-size:24px;font-weight:800;letter-spacing:.08em;">NAWO</div>
            <h1 style="margin:32px 0 12px;font-size:25px;line-height:1.25;">Confirmez votre adresse email</h1>
            <p>Bonjour{{ $user->full_name ? ' '.$user->full_name : '' }},</p>
            <p>Merci d’avoir créé votre compte NAWO. Confirmez votre adresse email pour commencer à utiliser votre espace.</p>
            <p>Pour confirmer votre adresse email, <a href="{{ $url }}" style="color:#7c3aed;font-weight:700;text-decoration:none;">cliquez ici</a>.</p>
            <p>Ce lien est valable {{ $expires }} minutes.</p>
            <p>Si vous n’avez pas créé de compte NAWO, vous pouvez ignorer ce message.</p>
            <p style="margin-top:28px;">À bientôt,<br><strong>L’équipe NAWO</strong></p>
        </div>
    </div>
</body>
</html>
