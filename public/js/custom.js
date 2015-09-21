var i = 5,
dummydatearr = [];

// Autocomplete dummy arr
dummydatearr.push(
	{
		'id': 0,
		'value': 'New date'
	}
);

while(i>0) {
	dummydatearr.push(
		{
			'id': i,
			'value': '2015-09-0' + ((i == 5) ? i + ' (Latest)' : i)
		}
	);
	i--;
}

$(document).ready(function() {

	// Autocomplete init
	$('#data_date').autocomplete({
		source: dummydatearr,
		minLength: 0,
		select: function(event, ui) {
			if (ui.item.id === 0) {
				$('#data_date').val('');
			}
		},
		open: function(event, ui) {
			$('.ui-autocomplete').off('menufocus hover mouseover mouseenter');
		}
	}).focus(function() {
		$(this).autocomplete('search', $(this).val());
	});

	// Date formatter init
	$('#data_date').dateEntry({
		dateFormat: 'ymd-',
		spinnerImage: ''
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