'use strict';

$(function() {
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

	// Remove a parent
	// Remember to put this after for example .noPageReload since the parent might
	// contain useful stuff and it will not be used if it is removed first
	$('.rmParent').on('click', function() {
		$(this).closest('.parent').remove();
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

	function showMainNav() {
		$('.mainNav').css('left', '0');
		$('.section.content').css('left', '22rem');
	}

	function hideMainNav() {
		$('.mainNav').css('left', '-22rem');
		$('.section.content').css('left', '0rem');
	}

	// Hide/Show mainNav
	if (Cookies.get('leftNav') === '1') {
		showMainNav();
	} else if (Cookies.get('leftNav') === '0') {
		hideMainNav();
	} else if ($(window).width() > 768) { // Desktop
		showMainNav();
	} else {
		showMainNav();
	}

	$('a.toggle_menu').on('click', function(event) {
		event.preventDefault();
		if (Cookies.get('leftNav') === '0') {
			Cookies.set('leftNav', '1');
			showMainNav();
		} else {
			Cookies.set('leftNav', '0');
			hideMainNav();
		}

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

// Tab menus
$(function() {
	const	activeTabContent	= $('a.tab.active').attr('showcontent');

	$('#' + activeTabContent).css('display', 'block');

	$('.tab[showcontent]').on('click', function() {
		const	className	= $(this).attr('showcontent');

		if ($(this).hasClass('active')) return;

		$(this).siblings().removeClass('active');
		$(this).addClass('active');

		$('body.js .tab_content').css('display', 'none');
		$('body.js #' + className).css('display', 'block');
	});
});
