<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RequestResponseTimeMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // 1. Get or Generate Request ID
        $requestId = $request->header('X-Request-ID') ?? (string) \Illuminate\Support\Str::uuid();
        $request->headers->set('X-Request-ID', $requestId);

        // 2. Process the request
        $response = $next($request);

        // 3. Calculate execution time in milliseconds
        $timeMs = defined('LARAVEL_START') ? round((microtime(true) - LARAVEL_START) * 1000, 2) : 0;

        // 4. Add to Response Headers
        $response->headers->set('X-Request-ID', $requestId);
        $response->headers->set('X-Response-Time-ms', $timeMs);

        // 5. (Removed) We rely on headers for metadata to avoid mutating array structures into objects.

        return $response;
    }
}
