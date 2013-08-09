(function($){
	
	var Scrollable = $.Scrollable = function( options, container){
		var oriAttr,
		self = this,
		$container = this.$container = $(container),
		options = this.options = $.extend(this.options,$.Scrollable.defaults,options||{});

		
		if(this.options.direction === 'vertical'){
			oriAttr = this.oriAttr = {
				x: 'Y', 
				pos: 'top',
				crossPos: 'left',
				size: 'height', 
				crossSize: 'width',
				client: 'clientHeight',
				crossClient: 'clientWidth', 
				offset: 'offsetHeight', 
				crossOffset: 'offsetWidth', 
				offsetPos: 'offsetTop',
				scroll: 'scrollTop', 
				scrollSize: 'scrollHeight',
				overflow : 'overflow-y',
				pageOffset : 'pageYOffset',
				mouseAttr : 'pageY'
			};
		}else if(this.options.direction === 'horizontal'){
			oriAttr = this.oriAttr = { // Horizontal
				x: 'X',
				pos: 'left', 
				crossPos: 'top',
				size: 'width', 
				crossSize: 'height',
				client: 'clientWidth', 
				crossClient: 'clientHeight', 
				offset: 'offsetWidth', 
				crossOffset: 'offsetHeight', 
				offsetPos: 'offsetLeft',
				scroll: 'scrollLeft',
				scrollSize: 'scrollWidth',
				overflow : 'overflow-x',
				pageOffset : 'pageXOffset',
				mouseAttr : 'pageX'

			};
		}

		//var $content = this.$content = $container.children().first();
		var $content = this.$content = $container.find('.'+options.contentClass);

		if($content.length === 0){
			$container.wrapInner('<div class="'+options.contentClass+'"/>');
			$content = this.$content = $container.find('.'+options.contentClass);
		}

		var $wrapper = this.$wrapper = $container.find('.'+options.wrapperClass);
		if($wrapper.length === 0){
			$content.wrap('<div class="'+options.wrapperClass+'"/>');
			$wrapper = this.$wrapper = $content.parents('.'+options.wrapperClass);
		}

		$container.css({
			'overflow' : 'hidden',
			'position' : 'relative'
		});
	
		$wrapper.css(oriAttr.size, '100%')
				.css(oriAttr.overflow, 'scroll');

		$content.css('overflow', 'hidden')
				.css(oriAttr.crossSize, 'auto');


		this.$bar = this.$container.find('.'+options.barClass);

		if(this.$bar.length === 0){
			this.$bar = $(options.barTmpl);
			this.$bar.appendTo($wrapper);
		}

		this.$bar.addClass(options.direction)
				 .attr('draggable',false);

		var $handle = this.$handle = this.$bar.find('.'+options.handleClass);

		setTimeout(function(){
			self.initLayout();
		}, 0);

		this.origPosition = 0;
		this.origHanlePosition = 0;

	};

	$.Scrollable.prototype.initLayout = function(){

		var oriAttr = this.oriAttr,
			options = this.options,
			$wrapper = this.$wrapper,
			$content = this.$content,
			$container = this.$container;

		var	wrapper = $wrapper[0], 
			content = $content[0];

		if(options.direction === 'horizontal'){
			$container.css('height',$container.height());
		}
		
		$wrapper.css(oriAttr.crossSize, wrapper.parentNode[oriAttr.crossClient] + wrapper[oriAttr.crossOffset] - wrapper[oriAttr.crossClient] + 'px');
		
		this.initBarLayout();
		this.initEvent();

		$container.trigger(this.eventName('initLayout'));
	};

	$.Scrollable.prototype.initBarLayout = function(){

		var self = this,
			oriAttr = this.oriAttr,
			options = this.options ,
			wrapper = this.$wrapper[0],
			content = this.$content[0];
			container = this.$container[0],
			bar = this.$bar[0],
			handle = this.$handle[0];

		var contentHeight = content[oriAttr.offset];
			wrapperHeihgt = wrapper[oriAttr.client];

		
		if( (wrapperHeihgt - contentHeight) > 0 ){
			this.$bar.hide();
		}

		if(typeof this.bLength === 'undefined'){
			this.hLength = handle[oriAttr.client];
			this.bLength = bar[oriAttr.client] - this.hLength;

			var percent = this.getPercentOffset();
			this.hPosition = percent*this.bLength;
			if(this.hPosition !== 0){
				this.handleMove(this.hPosition, false);
			}
		}else{
			var origLength = this.bLength;

			this.hLength = handle[oriAttr.client];

			var newLength = this.bLength = bar[oriAttr.client] - this.hLength;

			var hPosition = this.getHanldeOffset();

			if(hPosition !== 0){
				hPosition = hPosition * newLength / origLength;

				if(hPosition > newLength){
					hPosition = newLength;
				}

				this.$handle.css(oriAttr.pos, hPosition);
			}
		}
	};

	$.Scrollable.prototype.initEvent = function(){
		var oriAttr = this.oriAttr,
			self = this,
			$wrapper = this.$wrapper,
			$container = this.$container,
			$bar	= this.$bar;

		$wrapper.on('scroll', function(e){
			var percent =self.getPercentOffset();
			$(this).trigger(self.eventName('change'),[percent, 'content']);
		});


		$bar.on('mousedown', function(e){
			var oriAttr = self.oriAttr,
				bLength = self.bLength,
				hLength = self.hLength,
				$handle = self.$handle;


			self.hPosition = self.getHanldeOffset();
			if($(e.target).is($handle)){
				self.dragStart = e[oriAttr.mouseAttr];
				self.isDrag = true;
				$handle.addClass('is-drag');
				self.$bar.trigger(self.eventName('dragstart'));

				$(document).on(self.eventName('selectstart'),function(){
					return false;
				});

				self.$container.css({
					'-moz-user-focus': 'ignore',
					'-moz-user-input': 'disabled',
					'-moz-user-select': 'none'
				});

				$(document).on(self.eventName('mousemove'), function(e){
					if(self.isDrag){
						var oriAttr = self.oriAttr,
						bLength	= self.bLength;

						var stop = e[oriAttr.mouseAttr];
						start = self.dragStart;

						var distance = self.hPosition + stop - start; 

						if(distance < 0){
							distance = 0 ;
						}else if(distance > bLength){
							distance = bLength;
						}
						self.handleMove(distance,false,true);
					}
				});
			}else{
				var offset = e[oriAttr.mouseAttr] - self.$bar.offset()[oriAttr.pos] - hLength/2;

				if(offset < 0){
					offset = 0;
				}else if(offset > bLength){
					offset = bLength;
				}
	
				self.handleMove(offset, false, true);
			}
		});

		$(document).on(this.eventName('mouseup blur'), function(e){
			self.$handle.removeClass('is-drag');
			self.$bar.trigger('dragend.'+self.options.namespace);
			self.isDrag = false;
			$(document).off(self.eventName('selectstart mousemove'));

			self.$container.css({
				'-moz-user-focus': 'inherit',
				'-moz-user-input': 'inherit',
				'-moz-user-select': 'inherit'	
			});
		});


		$container.on(this.eventName('change'), function(e, value, type){
			if(type === 'bar'){
				self.move(value, true);
			}else if(type === 'content'){
				self.handleMove(value,true);
			}

			if(value === 0 ){
				self.$container.trigger(self.eventName('scrolltop'));
			}else if(value === 1){
				self.$container.trigger(self.eventName('scrollbottom'));
			}

		});
		$(window).resize(function(){
			self.initLayout();
		});
	};

	$.Scrollable.prototype.getHanldeOffset = function(){
		return parseInt(this.$handle.css(this.oriAttr.pos).replace('px',''),10);
	};

	$.Scrollable.prototype.getContentOffset = function(){
		var	oriAttr = this.oriAttr,
			wrapper = this.$wrapper[0];

		return (wrapper[oriAttr.pageOffset] || wrapper[oriAttr.scroll]);
	};

	$.Scrollable.prototype.getPercentOffset = function(){
		var	oriAttr = this.oriAttr,
			wrapper = this.$wrapper[0],
			content = this.$content[0];
		return this.getContentOffset()/(content[oriAttr.client] - wrapper[oriAttr.offset]);
	};

	$.Scrollable.prototype.handleMove = function(value, isPercent, trigger){
		var percent,$handle = this.$handle,
			params  = {},
			bLength	= this.bLength,
			oriAttr = this.oriAttr
			$bar = this.$bar;

		if(isPercent){
			value = value * bLength;
			percent = value;
		}else{
			percent = value / bLength;
		}

		params[oriAttr.pos] = value;
	
		$handle.css(params);

		if(trigger){
			$bar.trigger(this.eventName('change'),[percent,'bar']);
		}
	};
	

	$.Scrollable.prototype.eventName = function(events){
		if( typeof events !=='string' || events === ''){
			return false;
		}
		var namespace = this.options.namespace,
			events = events.split(' ');
		var length = events.length;
		for (var i = 0; i <	length; i++) {
			events[i] = events[i] + '.' + namespace;
		};
		return events.join(' ');
	};

	$.Scrollable.prototype.move = function(value, isPercent){
		var oriAttr = this.oriAttr,
			wrapper = this.$wrapper[0],
			content = this.$content[0];
		if(isPercent){
			if(value > 1 || value < 0){
				return false;
			}

			value = -value * (wrapper[oriAttr.offset] - content[oriAttr.client]);
		}
		
		wrapper[oriAttr.scroll] = value;
	};

	$.Scrollable.prototype.destory = function() {
		this.$handle.removeAttr('style');
		this.$bar.removeAttr('style');
		this.$container.removeData('scroll');
	};

	var defaults = $.Scrollable.defaults = {
		contentClass	: 'content',
		wrapperClass	: 'wrapper',
		barTmpl			: '<div class="scrollbar"><div class="handle"></div></div>',
		handleClass		: 'handle',
		direction		: 'vertical',//if it's 0, scroll orientation is 'horizontal',else scroll orientation is 'vertical'.
		namespace		: 'scrollable'
	};

	$.fn.scrollable = function(options){
		if(typeof options === 'string'){
			var args = Array.prototype.slice.call( arguments, 1 );
			this.each(function(){
				var instance = $(this).data('scroll');
				if ( !instance ) {
					return false;
				}
				if ( !$.isFunction( instance[options] ) || options.charAt(0) === "_" ) {
					return false;
				}
				// apply method
				instance[ options ].apply( instance, args );
			});
		}else{
			this.each(function(){
				if( ! $(this).data('scroll')){
					$(this).data('scroll',new $.Scrollable(options,this));
				}
			});

		}
		return this;
	};

})(jQuery);
