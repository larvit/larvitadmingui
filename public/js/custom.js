'use strict';

$(document).ready(function() {

	// Remove a parent
	$('.rmParent').on('click', function() {
		$(this).closest('.parent').remove();
	});
	$('.noPageReload').on('click', function(e) {
		e.preventDefault();

		if ($(this).attr('href') !== undefined) {
			$.get($(this).attr('href'));
		}

		if ($(this).prop('nodeName').toLowerCase() === 'button' || $(this).attr('type').toLowerCase() === 'submit') {
			const form = $(this).closest('form');

			let formData = form.serialize(),
			    action   = form.attr('action');

			if (action === undefined) {
				action = window.location.href;
			}

			if (formData !== '') formData += '&';

			$.post(action, formData + encodeURIComponent($(this).attr('name')) + '=' + encodeURIComponent($(this).attr('value')));
		}
	});

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
	if ($(window).width() > 768 && (Cookies.get('leftNav') === '1' || Cookies.get('leftNav') === undefined)) {
		location.hash = 'mainNav';
	}

	// If click hamburger AND left nav is hidden - set cookie AND show left nav
	$('a.open_menu').on('click', function(event) {
		event.preventDefault();
		Cookies.set('leftNav', '1');
		location.hash = 'mainNav';

		// Make sure stuff in the right place after DOM change
		if (typeof doResizeActions === 'function') {
			doResizeActions();
		}
	});

	// If click hamburger AND left nav is visible - remove cookie AND hide left nav
	$('a.close_menu').on('click', function(event) {
		event.preventDefault();
		Cookies.set('leftNav', '0');
		location.hash = '';

		// Make sure stuff in the right place after DOM change
		if (typeof doResizeActions === 'function') {
			doResizeActions();
		}
	});

	// Close msgBox
	window.addMsgBoxClose = function() {
		$('.msgBox a.close').on('click', function(event) {
			event.preventDefault();
			$(this).closest('.msgBox').remove();
		});
	};

	// Init close msgBox
	addMsgBoxClose();

	// Cookies storing closed state main nav top lvls
	$('.cp_nav').each(function() {
		// If cookie says so, collapse this item
		if (Cookies.get('mainNav_fold_' + $(this).attr('id')) === '1') {
			$(this).removeAttr('checked');
		}
		$(this).on('click', function() {
			if ($(this).is(':checked')) {
				// If cookie with this id exists, remove it
				Cookies.remove('mainNav_fold_' + $(this).attr('id'));
			} else {
				// Store cookie to keep this item collapsed
				Cookies.set('mainNav_fold_' + $(this).attr('id'), '1');
			}
		});
	});

});