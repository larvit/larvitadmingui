
function resizeHandler () {
	//header content_header content_top_nav content_form_top
	var viewport = {};
	viewport.top = $(window).scrollTop();
  viewport.bottom = viewport.top + $(window).height();
  var sbot = {};
  sbot.top = $('#sticky_bot').offset().top;
  sbot.bottom = sbot.top + $('#sticky_bot').height();
  if (sbot.bottom > viewport.bottom) {
  	$('#msg_print').text('should be out of bounds');
  	$('#sticky_bot').addClass('sticky');
		$('#sticky_bot .columns').css('width', $('#main_content').width() + 'px');
  } else {
  	$('#msg_print').text('should be within bounds');
  	$('#sticky_bot').removeClass('sticky');
		$('#sticky_bot .columns').css('width', '');
  }
	// If content height > viewport height - make bottom sub nav sticky
	//if ($(document).height() >= $(window).height()) {
		//$('#sticky_bot').addClass('sticky');
		//$('#sticky_bot .columns').css('width', $('#main_content').width() + 'px');
	//} else {
		//$('#sticky_bot').removeClass('sticky');
		//$('#sticky_bot .columns').css('width', '');
	//}
}

$(document).ready(function () {
	// Datepicker begin
	$('.data_date').datepicker();

	// If desktop AND cookie says so - show left nav
	if ($(window).width() > 768 && Cookies.get('leftNav') === '1') {
		location.hash = 'main_nav';
		//$(window).delay(500).trigger('resize');
	}

	// If click hamburger AND left nav is hidden - set cookie AND show left nav
	$('a.open_menu').on('click', function () {
		Cookies.set('leftNav', '1');
		//$(window).delay(500).trigger('resize');
		//location.hash = 'main_nav';
	});

	// If click hamburger AND left nav is visible - remove cookie AND hide left nav
	$('a.close_menu').on('click', function () {
		Cookies.remove('leftNav');
		//$(window).delay(500).trigger('resize');
		//location.hash = '';
	});
});

// Bind to window resize
$(window).ready(resizeHandler).resize(resizeHandler).scroll(resizeHandler);
//$(window).bind('resize', resizeHandler).trigger('resize');