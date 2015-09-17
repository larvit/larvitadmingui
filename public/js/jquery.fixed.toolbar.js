jQuery(function($) {

	(function() {

		var $window = $(window),
		$body = $('#body'),
		$toolbar = $('.toolbar_fixed');

		if (!$toolbar.length) return;

		$toolbar.wrap('<div class="row"><div class="eight columns toolbar_wrapper" style="position: relative;">');

		var toolbarHeight = $toolbar.outerHeight(), //  + 15 add 15px for margin
		$wrap = $toolbar.parent().css('height', toolbarHeight);

		$toolbar.css({
			width: $toolbar.parent().width()+'px',
			position: 'absolute'
		});

		var mode = 'inline',
		windowSize = {
			x: $window.width(),
			y: $window.height()
		};

		var onScroll = function() {

			var maxY = $wrap.offset().top + toolbarHeight,
			viewY = $window.scrollTop() + $window.height(),
			newSize = {
				x: $window.width(),
				y: $window.height()
			},
			sizeChanged = (newSize.x != windowSize.x || newSize.y != windowSize.y),
			formWidth = $('.toolbar_form .form_body').width();

			if (viewY > maxY && (sizeChanged || mode != 'inline')) {
				mode = 'inline';
				windowSize = newSize;
				$toolbar.css({
					top: 0,
					position: 'absolute',
					width: $toolbar.parent().width()+'px'//,
					//width: formWidth
				});
			} else if (viewY <= maxY && (sizeChanged || mode == 'inline')) {
				mode = 'fixed';
				windowSize = newSize;
				$toolbar.css({
					top: $window.height() - toolbarHeight,
					position: 'fixed',
					width: $toolbar.parent().width()+'px'//,
					//width: formWidth
				});
			}

		}

		$window.scroll(onScroll);
		$window.on('redraw', onScroll);
		$window.bind('resize', function() {
    	onScroll();
		}).trigger('resize');

		// do it again in a few hundred ms to correct for other UI initialisation
		setTimeout(onScroll, 200);

	})();
});