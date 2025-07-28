<?php
/**
 * saka.playground functions and definitions
 *
 * @link https://developer.wordpress.org/themes/basics/theme-functions/
 *
 * @package saka.playground
 */

if ( ! defined( '_S_VERSION' ) ) {
	// Replace the version number of the theme on each release.
	define( '_S_VERSION', '1.0.0' );
}

/**
 * Sets up theme defaults and registers support for various WordPress features.
 *
 * Note that this function is hooked into the after_setup_theme hook, which
 * runs before the init hook. The init hook is too late for some features, such
 * as indicating support for post thumbnails.
 */
function saka_playground_setup() {
	/*
		* Make theme available for translation.
		* Translations can be filed in the /languages/ directory.
		* If you're building a theme based on saka.playground, use a find and replace
		* to change 'saka-playground' to the name of your theme in all the template files.
		*/
	load_theme_textdomain( 'saka-playground', get_template_directory() . '/languages' );

	// Add default posts and comments RSS feed links to head.
	add_theme_support( 'automatic-feed-links' );

	/*
		* Let WordPress manage the document title.
		* By adding theme support, we declare that this theme does not use a
		* hard-coded <title> tag in the document head, and expect WordPress to
		* provide it for us.
		*/
	add_theme_support( 'title-tag' );

	/*
		* Enable support for Post Thumbnails on posts and pages.
		*
		* @link https://developer.wordpress.org/themes/functionality/featured-images-post-thumbnails/
		*/
	add_theme_support( 'post-thumbnails' );

	// This theme uses wp_nav_menu() in one location.
	register_nav_menus(
		array(
			'menu-1' => esc_html__( 'Primary', 'saka-playground' ),
		)
	);

	/*
		* Switch default core markup for search form, comment form, and comments
		* to output valid HTML5.
		*/
	add_theme_support(
		'html5',
		array(
			'search-form',
			'comment-form',
			'comment-list',
			'gallery',
			'caption',
			'style',
			'script',
		)
	);

	// Set up the WordPress core custom background feature.
	add_theme_support(
		'custom-background',
		apply_filters(
			'saka_playground_custom_background_args',
			array(
				'default-color' => 'ffffff',
				'default-image' => '',
			)
		)
	);

	// Add theme support for selective refresh for widgets.
	add_theme_support( 'customize-selective-refresh-widgets' );

	/**
	 * Add support for core custom logo.
	 *
	 * @link https://codex.wordpress.org/Theme_Logo
	 */
	add_theme_support(
		'custom-logo',
		array(
			'height'      => 250,
			'width'       => 250,
			'flex-width'  => true,
			'flex-height' => true,
		)
	);
}
add_action( 'after_setup_theme', 'saka_playground_setup' );

/**
 * Set the content width in pixels, based on the theme's design and stylesheet.
 *
 * Priority 0 to make it available to lower priority callbacks.
 *
 * @global int $content_width
 */
function saka_playground_content_width() {
	$GLOBALS['content_width'] = apply_filters( 'saka_playground_content_width', 640 );
}
add_action( 'after_setup_theme', 'saka_playground_content_width', 0 );

/**
 * Register widget area.
 *
 * @link https://developer.wordpress.org/themes/functionality/sidebars/#registering-a-sidebar
 */
function saka_playground_widgets_init() {
	register_sidebar(
		array(
			'name'          => esc_html__( 'Sidebar', 'saka-playground' ),
			'id'            => 'sidebar-1',
			'description'   => esc_html__( 'Add widgets here.', 'saka-playground' ),
			'before_widget' => '<section id="%1$s" class="widget %2$s">',
			'after_widget'  => '</section>',
			'before_title'  => '<h2 class="widget-title">',
			'after_title'   => '</h2>',
		)
	);
}
add_action( 'widgets_init', 'saka_playground_widgets_init' );

/**
 * Enqueue scripts and styles.
 */
function saka_playground_scripts() {
	wp_enqueue_style( 'saka-playground-style', get_stylesheet_uri(), array(), _S_VERSION );
	wp_style_add_data( 'saka-playground-style', 'rtl', 'replace' );

	wp_enqueue_script( 'saka-playground-navigation', get_template_directory_uri() . '/js/navigation.js', array(), _S_VERSION, true );

	if ( is_singular() && comments_open() && get_option( 'thread_comments' ) ) {
		wp_enqueue_script( 'comment-reply' );
	}
}
add_action( 'wp_enqueue_scripts', 'saka_playground_scripts' );

add_action('rest_api_init', function () {
    // ゲーム一覧取得API
    register_rest_route('famicom/v1', '/games', array(
        'methods' => 'GET',
        'callback' => 'get_famicom_games',
        'permission_callback' => '__return_true'
    ));
    
    // ゲーム追加API
    register_rest_route('famicom/v1', '/games', array(
        'methods' => 'POST',
        'callback' => 'add_famicom_game',
        'permission_callback' => '__return_true'
    ));
});


// ゲーム取得関数 
function get_famicom_games($request) {
    $data_file = get_template_directory() . '/data/games.json';
    
    if (file_exists($data_file)) {
        $games = json_decode(file_get_contents($data_file), true);
        return $games ?: [];
    } else {
        return [];
    }
}

// ゲーム追加関数 
function add_famicom_game($request) {
    $params = $request->get_params();
    $data_file = get_template_directory() . '/data/games.json';
    
    try {
        $games = file_exists($data_file) ? json_decode(file_get_contents($data_file), true) : [];
        $games[] = $params;
        file_put_contents($data_file, json_encode($games, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE));
        
        return array('success' => true, 'message' => 'Game added successfully');
    } catch (Exception $e) {
        return array('success' => false, 'message' => $e->getMessage());
    }
}


/**
 * Implement the Custom Header feature.
 */
require get_template_directory() . '/inc/custom-header.php';

/**
 * Custom template tags for this theme.
 */
require get_template_directory() . '/inc/template-tags.php';

/**
 * Functions which enhance the theme by hooking into WordPress.
 */
require get_template_directory() . '/inc/template-functions.php';

/**
 * Customizer additions.
 */
require get_template_directory() . '/inc/customizer.php';

/**
 * Load Jetpack compatibility file.
 */
if ( defined( 'JETPACK__VERSION' ) ) {
	require get_template_directory() . '/inc/jetpack.php';
}
