var i,
    dummydatearr = [],
    $datadate    = {},
    datefound    = 0,
    datetxt      = '';

// Autocomplete dummy arr
i = 5;
while(i>0) {
	dummydatearr.push(
		{
			'id': i,
			'value': '2015-09-0' + i
		}
	);
	i--;
}

function setDateTxt(txt) {
	$datadate.next('.notice').text(txt).show(0);
}

function updateDate() {
	datefound = 0;
	datetxt = '(New date)';
	$.each(dummydatearr, function(i, val) {
		if ($datadate.val().toString() === val.value.toString()) {
			datefound = 1;
			datetxt = (i === 0) ? '(Latest)' : '';
		}
	});
	setDateTxt(datetxt);
}

$(document).ready(function() {
	$datadate = $('#data_date');

	// Autocomplete init
	/*$datadate.autocomplete({
		source: dummydatearr,
		minLength: 0,
		select: function(event, ui) {

		},
		open: function(event, ui) {
			$('.ui-autocomplete').off('menufocus hover mouseover mouseenter');
		}
	}).focus(function() {
		$(this).autocomplete('search', $(this).val());
	});*/

	// Date formatter init
	$datadate.dateEntry({
		dateFormat: 'ymd-',
		spinnerImage: ''
	}).change(function() {
		updateDate();
	});

	// Date formatter initial value (Latest)
	$datadate.dateEntry('setDate', '2015-09-05');

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