#!/usr/bin/env sh

set -eu

pids=""

start_process() {
    if command -v setsid >/dev/null 2>&1; then
        setsid "$@" &
    else
        "$@" &
    fi

    pids="$pids $!"
}

stop_process() {
    pid="$1"
    [ -n "$pid" ] || return 0

    pgid="$(ps -o pgid= -p "$pid" 2>/dev/null | tr -d ' ')"
    if [ "$pgid" = "$pid" ] && [ "$pid" != "$$" ]; then
        kill -TERM "-$pid" 2>/dev/null || true
        return 0
    fi

    if command -v pgrep >/dev/null 2>&1; then
        for child in $(pgrep -P "$pid" 2>/dev/null || true); do
            stop_process "$child"
        done
    fi
    kill -TERM "$pid" 2>/dev/null || true
}

cleanup() {
    trap - EXIT INT TERM
    for pid in $pids; do
        stop_process "$pid"
    done
    wait 2>/dev/null || true
}

trap cleanup EXIT
trap 'exit 130' INT TERM

start_process php artisan serve --host=127.0.0.1 --port=8000

start_process php artisan queue:work --queue=emails,default --tries=3 --timeout=90

if php -r '$socket = @fsockopen("127.0.0.1", 1025); if (! $socket) exit(1); fclose($socket);'; then
    echo "Mailpit déjà actif : http://127.0.0.1:8025"
elif command -v mailpit >/dev/null 2>&1; then
    start_process sh -c 'exec mailpit --listen=127.0.0.1:8025 --smtp=127.0.0.1:1025 >/tmp/nawo-mailpit.log 2>&1'
    echo "Mailpit démarré : http://127.0.0.1:8025"
else
    echo "Mailpit absent : emails envoyés selon la configuration MAIL_MAILER."
fi

echo "API démarrée : http://127.0.0.1:8000"
echo "Worker queue démarré. Ctrl+C arrête tous les processus."

wait
