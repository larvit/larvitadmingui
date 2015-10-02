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

	// Close msg_box
	window.addMsgBoxClose = function() {
		$('.msg_box a.close').on('click', function(event) {
			event.preventDefault();
			$(this).closest('.msg_box').remove();
		});
	};

	// Init close msg_box
	addMsgBoxClose();

	// Cookies storing closed state main nav top lvls
	$('.cp_nav').each(function() {
		// If cookie says so, collapse this item
		if (Cookies.get($(this).attr('id')) === '1') {
			$(this).removeAttr('checked');
		}
		$(this).on('click', function() {
			if ($(this).is(':checked')) {
				// If cookie with this id exists, remove it
				Cookies.remove($(this).attr('id'));
			} else {
				// Store cookie to keep this item collapsed
				Cookies.set($(this).attr('id'), '1');
			}
		});
	});

});