'use strict';

jQuery(function($) {
	(function() {
		var $window   = $(window),
		    $content  = $('.section.content'),
		    $toolbar  = $('.toolbar_fixed'),
		    $mainNav  = $('.main_nav'),
		    $contWrap = $('#content_wrapper'),
		    $contHead = $('#content_header'),
		    mode      = 'inline',
		    windowSize,
		    contentSize,
		    toolbarHeight,
		    $wrap;

		if ( ! $toolbar.length) {
			return;
		}

		$toolbar.wrap('<div class="row"><div class="nine columns toolbar_wrapper" style="position: relative;">');
		toolbarHeight = $toolbar.height();
		$wrap         = $toolbar.parent().css('height', toolbarHeight);

		$toolbar.css({
			width: $toolbar.parent().width() + 'px',
			position: 'absolute'
		});

		windowSize = {
			x: $window.width(),
			y: $window.height()
		};
		contentSize = {
			x: $content.width(),
			y: $content.height()
		};

		window.doResizeActions = function() {
			var maxY  = $wrap.offset().top  + toolbarHeight,
			    viewY = $window.scrollTop() + $window.height(),
			    newSize,
			    newContentSize,
			    sizeChanged,
			    contentSizeChanged;

			newSize = {
				x: $window.width(),
				y: $window.height()
			};

			newContentSize = {
				x: $content.width(),
				y: $content.height()
			};

			sizeChanged        = (newSize.x != windowSize.x || newSize.y != windowSize.y);
			contentSizeChanged = (newContentSize.x != contentSize.x || newContentSize.y != contentSize.y);

			if (viewY > maxY && (sizeChanged || contentSizeChanged || mode != 'inline')) {
				mode = 'inline';
				windowSize = newSize;
				contentSize = newContentSize;
				$toolbar.css({
					top:      0,
					position: 'absolute',
					width:    $toolbar.parent().width() + 'px'
				});
			} else if (viewY <= maxY && (sizeChanged || contentSizeChanged || mode == 'inline')) {
				mode = 'fixed';
				windowSize = newSize;
				contentSize = newContentSize;
				$toolbar.css({
					top:      $window.height() - toolbarHeight,
					position: 'fixed',
					width:    $toolbar.parent().width() + 'px'
				});
			}

			// Make main nav fill out full height of content
			$mainNav.height($contWrap.height() + $contHead.height() + 14);
		};

		$window.scroll(doResizeActions);
		$window.on('redraw', doResizeActions);
		$mainNav.on('transitionend webkitTransitionEnd oTransitionEnd MSTransitionEnd', doResizeActions);
		$window.bind('resize', function() {
			doResizeActions();
		}).trigger('resize');

		// do it again in a few hundred ms to correct for other UI initialisation
		setTimeout(doResizeActions, 200);

	})();
});