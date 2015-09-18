jQuery(function($) {

	(function() {

		var $window = $(window),
		$body = $('#body'),
		$toolbar = $('.toolbar_fixed');

		if (!$toolbar.length) return;

		$toolbar.wrap('<div class="row"><div class="nine columns toolbar_wrapper" style="position: relative;">');

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

		window.placeFooterBtns = function() {
			//console.log($toolbar);

			var maxY = $wrap.offset().top + toolbarHeight,
			viewY = $window.scrollTop() + $window.height(),
			newSize = {
				x: $window.width(),
				y: $window.height()
			},
			sizeChanged = (newSize.x != windowSize.x || newSize.y != windowSize.y);

			if (viewY > maxY && (sizeChanged || mode != 'inline')) {
				mode = 'inline';
				windowSize = newSize;
				$toolbar.css({
					top: 0,
					position: 'absolute',
					width: $toolbar.parent().width()+'px'
				});
			} else if (viewY <= maxY && (sizeChanged || mode == 'inline')) {
				mode = 'fixed';
				windowSize = newSize;
				$toolbar.css({
					top: $window.height() - toolbarHeight,
					position: 'fixed',
					width: $toolbar.parent().width()+'px'
				});
			}

		}

		$window.scroll(placeFooterBtns);
		$window.on('redraw', placeFooterBtns);
		$window.bind('resize', function() {
			placeFooterBtns();
		}).trigger('resize');

		// do it again in a few hundred ms to correct for other UI initialisation
		setTimeout(placeFooterBtns, 200);

	})();
});