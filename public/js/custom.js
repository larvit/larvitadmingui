$(function() {
	/* Datepicker begin */
	$('.data_date').datepicker();
	/* Datepicker end */
	/* if desktop AND cookie says so - show left nav */
	if ($(window).width() > 768 && Cookies.get('leftNav') === '1') {
		location.hash = 'main_nav';
	}
	/* if click hamburger AND left nav is hidden - set cookie AND show left nav */
	$('a.open_menu').on('click', function () {
		Cookies.set('leftNav', '1');
		/*location.hash = 'main_nav';*/
	});
	/* if click hamburger AND left nav is visible - remove cookie AND hide left nav */
	$('a.close_menu').on('click', function () {
		Cookies.remove('leftNav');
		/*location.hash = '';*/
	});
});