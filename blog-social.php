<?php
declare(strict_types=1);

/**
 * Server-side Open Graph adapter for blog.html?post=<id>.
 * Facebook does not run the JavaScript in blog.html, so this file obtains the
 * post details from WordPress and injects them into the initial HTML response.
 */

const BLOG_API_URL = 'https://blog.ctpulloa.com/wp-json/wp/v2/posts/';
const PUBLIC_BLOG_URL = 'https://www.ctpulloa.com/blog.html?post=';

function fetch_remote(string $url, int $timeout = 8): string
{
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => $timeout,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_USERAGENT => 'CTP-Ulloa-Social-Preview/1.0',
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        return is_string($body) && $status >= 200 && $status < 300 ? $body : '';
    }

    $context = stream_context_create([
        'http' => [
            'timeout' => $timeout,
            'header' => "User-Agent: CTP-Ulloa-Social-Preview/1.0\r\n",
        ],
    ]);
    $body = @file_get_contents($url, false, $context);

    return is_string($body) ? $body : '';
}

function plain_text($value): string
{
    return trim(preg_replace('/\s+/', ' ', html_entity_decode(strip_tags((string) $value), ENT_QUOTES | ENT_HTML5, 'UTF-8')) ?? '');
}

function metadata_value(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8');
}

$post_id = filter_input(INPUT_GET, 'post', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);
$html = @file_get_contents(__DIR__ . '/blog.html');

if (!$post_id || !is_string($html)) {
    http_response_code(404);
    exit('Página no encontrada.');
}

$post_payload = fetch_remote(BLOG_API_URL . $post_id . '?_embed=1');
$post = json_decode($post_payload, true);
$has_post = is_array($post) && !empty($post['id']);

$title = $has_post ? plain_text($post['title']['rendered'] ?? '') : 'Blog | CTP de Ulloa';
$description = $has_post
    ? plain_text($post['excerpt']['rendered'] ?? $post['content']['rendered'] ?? '')
    : 'Noticias, actividades y publicaciones del CTP de Ulloa.';
$description = function_exists('mb_substr') ? mb_substr($description, 0, 280) : substr($description, 0, 280);
$image_alt = $title ?: 'Imagen de la entrada del blog del CTP de Ulloa';
$canonical_url = PUBLIC_BLOG_URL . $post_id;
$social_image_url = 'https://www.ctpulloa.com/social-image.php?post=' . $post_id;

$open_graph = sprintf(
    "\n  <link rel=\"canonical\" href=\"%s\" />\n  <meta property=\"og:locale\" content=\"es_CR\" />\n  <meta property=\"og:type\" content=\"article\" />\n  <meta property=\"og:site_name\" content=\"CTP de Ulloa\" />\n  <meta property=\"og:title\" content=\"%s\" />\n  <meta property=\"og:description\" content=\"%s\" />\n  <meta property=\"og:url\" content=\"%s\" />\n  <meta property=\"og:image\" content=\"%s\" />\n  <meta property=\"og:image:secure_url\" content=\"%s\" />\n  <meta property=\"og:image:type\" content=\"image/jpeg\" />\n  <meta property=\"og:image:width\" content=\"1200\" />\n  <meta property=\"og:image:height\" content=\"630\" />\n  <meta property=\"og:image:alt\" content=\"%s\" />\n  <meta name=\"twitter:card\" content=\"summary_large_image\" />\n  <meta name=\"twitter:title\" content=\"%s\" />\n  <meta name=\"twitter:description\" content=\"%s\" />\n  <meta name=\"twitter:image\" content=\"%s\" />",
    metadata_value($canonical_url),
    metadata_value($title),
    metadata_value($description),
    metadata_value($canonical_url),
    metadata_value($social_image_url),
    metadata_value($social_image_url),
    metadata_value($image_alt),
    metadata_value($title),
    metadata_value($description),
    metadata_value($social_image_url)
);

$html = preg_replace('/<\/head>/i', $open_graph . "\n</head>", $html, 1) ?? $html;
header('Content-Type: text/html; charset=UTF-8');
header('Cache-Control: public, max-age=300');
echo $html;
