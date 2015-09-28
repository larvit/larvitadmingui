'use strict';

var i,
    dummyDateArr     = [],
    $dataDate        = {},
    dateAllowedChars = /[^0-9-]/g,
    dateAllowedStr   = /^[0-9]{4}\-(0[1-9]|1[012])\-(0[1-9]|[12][0-9]|3[01])/,
    tmpVal           = '';

// Autocomplete dummy arr
i = 5;
while (i > 0) {
	dummyDateArr.push({
		'id': i,
		'value': '2015-09-0' + i
	});

	i --;
}

function validDate(val) {
	var obj,
	    y,
	    m,
	    d;

	if (val === undefined)
		return false;

	obj = val.match(dateAllowedStr);

	if ( ! obj) {
		return false; // Not even a date
	}

	y   = parseInt(obj[0].substring(4));
	m   = obj[1];
	d   = obj[2];

	if (d === '31' && (m === '4' || m === '6' || m === '9' || m === '11')) {
		return false; // 31st of a month with 30 days
	}

	if (d >= '30' && m === '2') {
		return false; // Feb 30th or 31st
	}

	if (m === '2' && d === '29' && ! (y % 4 === 0 && (y % 100 !== 0 || y % 400 === 0))) {
		return false; // Feb 29th outside a leap year
	}

	return true;
}

function setDateTxt(el, txt) {
	el.next('.notice').text(txt).show(0);
}

function updateDate(el) {
	var str,
	    dateTxt;

	if (validDate(el.val())) {
		str = el.val();
	} else {
		str = dummyDateArr[0].value;
		el.val(str);
	}

	dateTxt = '(New date)';
	$.each(dummyDateArr, function(i, val) {
		if (str === val.value) {
			dateTxt = (i === 0) ? '(Latest)' : '';
		}
		i ++;
	});
	setDateTxt(el, dateTxt);
}

$(document).ready(function() {
	$dataDate = $('#data_date');

	// Autocomplete init
	$dataDate.autocomplete({
		source: dummyDateArr,
		minLength: 0,
		change: function() {
			updateDate($(this));
		},
		open: function() {
			$('.ui-autocomplete').off('menufocus hover mouseover mouseenter');
		}
	}).focus(function() {
		$(this).autocomplete('search', $(this).val());
	});

	// Date formatter initial value (Latest)
	$dataDate.val(dummyDateArr[0].value);

	updateDate($dataDate);

	// Only allow numbers or '-' in date field
	$dataDate.on('keyup', function() {
		tmpVal = $(this).val();
		$(this).val(tmpVal.replace(dateAllowedChars, ''));
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
	if ($(window).width() > 768 && Cookies.get('leftNav') === '1') {
		location.hash = 'main_nav';
	}

	// If click hamburger AND left nav is hidden - set cookie AND show left nav
	$('a.open_menu').on('click', function() {
		Cookies.set('leftNav', '1');
		//location.hash = 'main_nav';
	});

	// If click hamburger AND left nav is visible - remove cookie AND hide left nav
	$('a.close_menu').on('click', function() {
		Cookies.remove('leftNav');
		//location.hash = '';
	});
});