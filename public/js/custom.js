'use strict';

$(document).ready(function() {
	// Sortable init
	$('table.sortable tbody').sortable({
		helper: fixWidthHelper
	}).disableSelection();

	// Helper to keep full width of sortable tr's
	function fixWidthHelper(e, ui) {
		ui.children().each(function() {
			$(this).width($(this).width());
		});

		return ui;
	}

	// If desktop AND cookie says so - show left nav
	if ($(window).width() > 768 && Cookies.get('leftNav') === '1') {
		location.hash = 'main_nav';
	}

	// If click hamburger AND left nav is hidden - set cookie AND show left nav
	$('a.open_menu').on('click', function(event) {
		event.preventDefault();
		Cookies.set('leftNav', '1');
		location.hash = 'main_nav';

		// Make sure stuff in the right place after DOM change
		if (typeof doResizeActions === 'function') {
			doResizeActions();
		}
	});

	// If click hamburger AND left nav is visible - remove cookie AND hide left nav
	$('a.close_menu').on('click', function(event) {
		event.preventDefault();
		Cookies.remove('leftNav');
		location.hash = '';

		// Make sure stuff in the right place after DOM change
		if (typeof doResizeActions === 'function') {
			doResizeActions();
		}
	});

	// If click close msg_box
	$('.msg_box a.close').on('click', function(event) {
		event.preventDefault();
		$(this).closest('.msg_box').remove();
	});
});