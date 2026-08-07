<?php
declare(strict_types=1);

/**
 * Produces a 1200 x 630 Open Graph card without cropping the featured image.
 * The image is centered on a navy background so portrait images remain whole.
 */

const BLOG_API_URL = 'https://blog.ctpulloa.com/wp-json/wp/v2/posts/';

function fetch_remote(string $url, int $timeout = 10): string
{
    if (function_exists('curl_init')) {
        $curl = curl_init($url);
        curl_setopt_array($curl, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_FOLLOWLOCATION => true,
            CURLOPT_CONNECTTIMEOUT => $timeout,
            CURLOPT_TIMEOUT => $timeout,
            CURLOPT_USERAGENT => 'CTP-Ulloa-Social-Card/1.0',
        ]);
        $body = curl_exec($curl);
        $status = (int) curl_getinfo($curl, CURLINFO_HTTP_CODE);
        curl_close($curl);

        return is_string($body) && $status >= 200 && $status < 300 ? $body : '';
    }

    $context = stream_context_create([
        'http' => [
            'timeout' => $timeout,
            'header' => "User-Agent: CTP-Ulloa-Social-Card/1.0\r\n",
        ],
    ]);
    $body = @file_get_contents($url, false, $context);

    return is_string($body) ? $body : '';
}

function featured_image_url(int $post_id): string
{
    $post = json_decode(fetch_remote(BLOG_API_URL . $post_id . '?_embed=1'), true);
    $media = is_array($post) ? ($post['_embedded']['wp:featuredmedia'][0] ?? null) : null;

    return is_array($media) ? (string) ($media['source_url'] ?? '') : '';
}

function output_fallback(): void
{
    $fallback = __DIR__ . '/assets/img/logo-web-ctpulloa-2026.png';

    if (is_file($fallback)) {
        header('Content-Type: image/png');
        header('Cache-Control: public, max-age=300');
        readfile($fallback);
        exit;
    }

    http_response_code(404);
    exit;
}

$post_id = filter_input(INPUT_GET, 'post', FILTER_VALIDATE_INT, ['options' => ['min_range' => 1]]);

if (!$post_id || !function_exists('imagecreatetruecolor') || !function_exists('imagecreatefromstring')) {
    output_fallback();
}

$featured_image = featured_image_url($post_id);
$source_bytes = $featured_image !== '' ? fetch_remote($featured_image) : '';
$source = $source_bytes !== '' ? @imagecreatefromstring($source_bytes) : false;

if (!$source) {
    output_fallback();
}

$source_width = imagesx($source);
$source_height = imagesy($source);

if ($source_width < 1 || $source_height < 1) {
    imagedestroy($source);
    output_fallback();
}

$card_width = 1200;
$card_height = 630;
$scale = min($card_width / $source_width, $card_height / $source_height);
$target_width = max(1, (int) round($source_width * $scale));
$target_height = max(1, (int) round($source_height * $scale));
$target_x = (int) floor(($card_width - $target_width) / 2);
$target_y = (int) floor(($card_height - $target_height) / 2);

$card = imagecreatetruecolor($card_width, $card_height);
$background = imagecolorallocate($card, 18, 33, 74);
imagefill($card, 0, 0, $background);
imagecopyresampled($card, $source, $target_x, $target_y, 0, 0, $target_width, $target_height, $source_width, $source_height);
imagedestroy($source);

header('Content-Type: image/jpeg');
header('Cache-Control: public, max-age=3600');
imagejpeg($card, null, 90);
imagedestroy($card);
