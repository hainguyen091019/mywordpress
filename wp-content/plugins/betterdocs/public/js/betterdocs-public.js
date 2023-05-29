(function($) {
  "use strict";
  $(document).ready(function() {
    let request;
    let searchForm = $(".betterdocs-searchform");
    let searchField = $(".betterdocs-search-field");
    let searchCategory = $(".betterdocs-search-category");
    let popularSearch = $(".betterdocs-popular-search-keyword .popular-keyword");

    /**
     * Store search data to sessionStorage
     */
    /*sessionStorage.setItem("betterdocs_search_data", betterdocspublic.search_keyword);
    sessionStorage.setItem("search_not_found", betterdocspublic.search_not_found);*/

    // disable from submit on enter
    popularSearch.on("click", function(e) {
      e.preventDefault();
      let popularKeyword = $(this).text();
      $(this).parent('.betterdocs-popular-search-keyword').siblings('.betterdocs-searchform').find('.betterdocs-search-field').val(popularKeyword).trigger('propertychange');
    });

    searchForm.on("keyup keypress", function(e) {
      searchForm.each(function() {
        let keyCode = e.keyCode || e.which;
        if (keyCode === 13) {
          e.preventDefault();
          return false;
        }
      });
    });

    // ajax load titles on keyup to searchbox
    searchField.on("input propertychange paste", function(e) {
      searchField.each(function() {
        let thisEvent = $(this);
        let inputVal = $(this).val();
        let inputCat = thisEvent.parent('.betterdocs-searchform-input-wrap').siblings('.betterdocs-search-category').find(':selected').val();
        let resultWrapper = thisEvent.parent().parent(".betterdocs-searchform");
        let kbSlug = thisEvent.parent().parent('.betterdocs-searchform').find('.betterdocs-search-kbslug').val();

        //Before the result is fetched, we have to remove the search result wrapper based on letter limit characters
        if ( ! inputVal.length ) {
          var nodeResults = thisEvent.parents(".betterdocs-live-search").find(".betterdocs-search-result-wrap");
          if (nodeResults.length > 0) {
            nodeResults.each(function (item) {
              $(nodeResults[item]).remove();
            });
          }
        }

        liveSearchAction(e, thisEvent, inputVal, inputCat, resultWrapper, kbSlug);
      });
    });

    $('.betterdocs-searchform .betterdocs-search-category').on("change", function(e) {
        let thisEvent = $(this);
        let inputVal = thisEvent.siblings('.betterdocs-searchform-input-wrap').children('.betterdocs-search-field').val();
        let inputCat = $(this).find(':selected').val();
        let resultWrapper = thisEvent.parent(".betterdocs-searchform");
        let kbSlug = thisEvent.parent('.betterdocs-searchform').find('.betterdocs-search-kbslug').val();
        liveSearchAction(e, thisEvent, inputVal, inputCat, resultWrapper, kbSlug);
    });

    function liveSearchAction(e, thisEvent, inputVal, inputCat, resultWrapper, kbSlug) {
      let resultList = thisEvent.parent(".betterdocs-searchform").find(".betterdocs-search-result-wrap");
      let searchLoader = thisEvent.parent().find(".docs-search-loader");
      let searchClose = thisEvent.parent().find(".docs-search-close");
      let search_letter_limit = betterdocspublic.search_letter_limit;
      if (
          e.key != "a" &&
          e.keyCode != 17 &&
          e.keyCode != 91 &&
          inputVal.length >= search_letter_limit
      ) {
        delay(function() {
          ajaxLoad(
              inputVal,
              inputCat,
              kbSlug,
              resultWrapper,
              resultList,
              searchLoader,
              searchClose,
              thisEvent
          );
        }, 400);
      } else if (!inputVal.length) {
        thisEvent.parent().parent(".betterdocs-live-search").find(".betterdocs-search-result-wrap").addClass("hideArrow");
        thisEvent.parent().parent(".betterdocs-live-search").find(".docs-search-result").slideUp(300);
        searchLoader.hide();
        searchClose.hide();
      }
    }

    $(".docs-search-close").on("click", function() {
      $(this).hide();
      $(".betterdocs-live-search .betterdocs-search-result-wrap").addClass(
        "hideArrow"
      );
      $(".betterdocs-live-search .docs-search-result").slideUp(300);
      searchField.val("");
    });

    var delay = (function() {
      var timer = 0;
      return function(callback, ms) {
        clearTimeout(timer);
        timer = setTimeout(callback, ms);
      };
    })();

    function ajaxLoad(
      inputVal,
      inputCat,
      kbSlug,
      resultWrapper,
      resultList,
      searchLoader,
      searchClose,
      inputEvent
    ) {
      if (request) {
        request.abort();
      }
      request = $.ajax({
        url: betterdocspublic.ajax_url,
        type: "post",
        data: {
          action: "betterdocs_get_search_result",
          search_input: inputVal,
          search_cat: inputCat,
          kb_slug: kbSlug
        },
        beforeSend: function() {
          searchLoader.show();
          searchClose.hide();
          resultList.addClass("hideArrow");
          $(".betterdocs-live-search .docs-search-result").slideUp(400);
        },
        success: function(response) {
          resultList.remove();
          searchLoader.hide();
          searchClose.show();

          let search_letter_limit = betterdocspublic.search_letter_limit;
          var inputVal2 = inputEvent.val();

          //After the result is fetched, we have to remove the search result wrapper
          if( inputVal2.length < search_letter_limit ) {
            var nodeResults = $(".betterdocs-live-search").find(".betterdocs-search-result-wrap");
            if (nodeResults.length > 0) {
              nodeResults.each(function (item) {
                $(nodeResults[item]).slideUp(400);
              });
            }
            searchClose.hide();
            return;
          }

          resultWrapper.append(response.data.post_lists);
        }
      });
    }

    var betterdocsToc = $(".betterdocs-toc");
    var betterdocsSidebar = $("#betterdocs-sidebar");
    if (betterdocsToc.length && betterdocsSidebar.length) {
      // create an instance of TOC
      var stickyTocContent = $(".betterdocs-toc").clone();
      $(".sticky-toc-container").append(stickyTocContent);

      // make sticky toc when sidebar-content scroll ends
      $(window).on("scroll", function() {
        var stickyToc = $(".sticky-toc-container");
        var tocHeight = $(".betterdocs-sidebar-content").outerHeight();
        var tocSidebar = document.querySelector(".betterdocs-sidebar-content");
        var tocSidebarRect = tocSidebar.getBoundingClientRect();
        var tocSidebarTop = Math.abs(tocSidebarRect.top);

        if (tocSidebarRect.top < 0 && tocHeight <= tocSidebarTop) {
          stickyToc.addClass("toc-sticky");
        } else {
          stickyToc.removeClass("toc-sticky");
        }
        if (
          $(window).scrollTop() >=
            betterdocsSidebar.offset().top +
              betterdocsSidebar.outerHeight() -
              window.innerHeight &&
          !betterdocsSidebar.hasClass("betterdocs-el-single-sidebar")
        ) {
          stickyToc.removeClass("toc-sticky");
        }
      });
    }

    // Add smooth scrolling to links
    $(document).on("scroll", onScroll);
    // alert(betterdocspublic.sticky_toc_offset);
    var toc_links = $(".betterdocs-toc .toc-list a");
    toc_links.on("click", function(e) {
      e.preventDefault();
      $(document).off("scroll");
      toc_links.each(function() {
        $(this).removeClass("active");
      });
      $(this).addClass("active");
      var target = this.hash,
        $target = $(target);
      var scrollTopOffset = $target.offset().top;
      $("html, body")
        .stop()
        .animate(
          { scrollTop: scrollTopOffset - betterdocspublic.sticky_toc_offset },
          "slow",
          function() {
            $(document).on("scroll", onScroll);
          }
        );
    });

    // function to add link active class on scroll
    function onScroll() {
      var scrollPos = $(document).scrollTop();
      $(
        ".sticky-toc-container .betterdocs-toc .toc-list a,.betterdocs-full-sidebar-right .betterdocs-toc .toc-list a"
      ).each(function() {
        var currLink = $(this);
        var refElement = $(currLink.attr("href"));
        if (
          refElement.position().top <= scrollPos &&
          refElement.position().top + refElement.height() > scrollPos
        ) {
          $(".betterdocs-toc .toc-list a").removeClass("active");
          currLink.addClass("active");
        }
      });
    }

    // close sticky toc
    $(".close-toc").on("click", function(event) {
      event.preventDefault();
      $(".sticky-toc-container").remove(".sticky-toc-container");
    });

    // close sticky toc
    $("body").on("click", ".betterdocs-print-btn", function(event) {
      let entryTitle = "";
      if ($("#betterdocs-entry-title").length) {
        entryTitle = document.getElementById("betterdocs-entry-title")
          .innerHTML;
      }

      var printContents = document.getElementById("betterdocs-single-content")
        .innerHTML;
      var combined = document.createElement("div");
      combined.innerHTML = "<h1>" + entryTitle + "</h1>" + " " + printContents;
      combined.id = "new-doc-print";
      var pwidth = document.getElementById("betterdocs-single-content")
        .offsetWidth;
      var wheight = $(window).height();
      var winPrint = window.open(
        "",
        "",
        "left=50%,top=10%,width=" +
          pwidth +
          ",height=" +
          wheight +
          ",toolbar=0,scrollbars=0,status=0"
      );
      winPrint.document.write(combined.outerHTML);
      winPrint.document.close();
      winPrint.focus();
      winPrint.print();
      winPrint.close();
    });

    // Add accordion to sidebar category grid
    var sidebarContent = $(".betterdocs-sidebar-content");
    var catList = $(
      ".betterdocs-sidebar-content .docs-single-cat-wrap .docs-item-container"
    );
    var currentCatList = $(
      ".betterdocs-sidebar-content .docs-single-cat-wrap.current-category .docs-item-container"
    );
    var catHeading = $(
      ".betterdocs-sidebar-content .docs-single-cat-wrap .docs-cat-title-wrap"
    );

    var active_subcategory = $('.docs-sub-cat.current-sub-cat');

    catList.hide();

    if (currentCatList.length) {
      currentCatList.show().addClass("show");
    }

    /**
     * This code toggles the nested subcat arrow to down direction if it is activated, this approach is from bottom to top
     */
    if( active_subcategory.length ) {
      var subcat = $(active_subcategory);
      while( subcat.attr('class') === 'docs-sub-cat' || subcat.attr('class') === 'docs-sub-cat current-sub-cat') {
        subcat.prev().children('.toggle-arrow').toggle();
        subcat.parent().css('display','block');
        subcat = subcat.parent();
      }
    }

    catHeading.click(function(e) {
      var $this = $(this);
      sidebarContent.find(".active-title").removeClass("active-title");
      $this.toggleClass("active-title");
      if ($this.next(catList).hasClass("show")) {
        $this
          .next(catList)
          .slideUp()
          .removeClass("show");
      } else if (catList.hasClass("show")) {
        catList.slideUp().removeClass("show");
        $this
          .next(catList)
          .slideToggle()
          .toggleClass("show");
      } else {
        $this
          .next(catList)
          .slideToggle()
          .toggleClass("show");
      }
    });

    var docSubCat = $(".docs-sub-cat-title, .el-betterdocs-grid-sub-cat-title");
    docSubCat.each(function() {
      $(this).click(function(e) {
        e.preventDefault();
        $(this)
          .children(".toggle-arrow")
          .toggle();
        $(this)
          .next(".docs-sub-cat, .docs-sub-cat-list")
          .slideToggle();
      });
    });

    var docTocTitle = $(".betterdocs-toc.collapsible-sm .toc-title");
    docTocTitle.each(function() {
      $(this).click(function(e) {
        e.preventDefault();
        $(this)
          .children(".angle-icon")
          .toggle();
        $(this)
          .next(".toc-list")
          .slideToggle();
      });
    });

    // single post feedback form modal
    var formModal = $("#betterdocs-form-modal");
    var formModalContent = $("#betterdocs-form-modal .modal-content");

    //select all the a tag with name equal to modal
    $("a[name=betterdocs-form-modal]").click(function(e) {
      e.preventDefault();
      formModal.fadeIn(500);
    });

    //if outside of modal content is clicked
    $(document).mouseup(function(e) {
      if (
        !formModalContent.is(e.target) &&
        formModalContent.has(e.target).length === 0
      ) {
        formModal.fadeOut();
      }
    });

    //if close button is clicked
    $(".betterdocs-modalwindow .close").click(function(e) {
      e.preventDefault();
      formModal.fadeOut(500);
    });

    // ajax feedback form submit
    var feedbackForm = $("#betterdocs-feedback-form");

    var feedbackFormFields = $(
      "#betterdocs-feedback-form input, #betterdocs-feedback-form textarea"
    );
    feedbackFormFields.on("keyup", function() {
      $(this).removeClass("val-error");
      $(this)
        .siblings(".error-message")
        .remove();
    });
    feedbackForm.on("submit", function(e) {
      e.preventDefault();
      var form = $(this);
      var message_name = $("#message_name");
      var message_email = $("#message_email");
      var message_subject = $("#message_subject");
      var message_text = $("#message_text");
      betterdocsFeedbackFormSubmit(
        form,
        message_name,
        message_email,
        message_subject,
        message_text
      );
    });
    function betterdocsFeedbackFormSubmit(
      form,
      message_name,
      message_email,
      message_subject,
      message_text
    ) {
      if (request) {
        request.abort();
      }
      request = $.ajax({
        url: betterdocspublic.ajax_url,
        type: "post",
        data: {
          action: "betterdocs_feedback_form_submit",
          form: form.serializeArray(),
          postID: betterdocspublic.post_id,
          message_name: message_name.val(),
          message_email: message_email.val(),
          message_subject: message_subject.val(),
          message_text: message_text.val(),
          security: betterdocspublic.nonce,
        },
        beforeSend: function() {},
        success: function(data) {
          var data = JSON.parse(data);
          if (data.sentStatus) {
            if (data.sentStatus === "success") {
              $(".response").html(
                '<span class="success-message">' + data.sentMessage + "</span>"
              );
              form[0].reset();
              delay(function() {
                $(".betterdocs-modalwindow").fadeOut(500);
                $(".response .success-message").remove();
              }, 3000);
            } else {
              $(".response").html(
                '<span class="error-message">' + data.sentMessage + "</span>"
              );
            }
          } else {
            if (data.nameStatus === "error") {
              if (message_name.hasClass("val-error") == false) {
                message_name.addClass("val-error");
                $(".form-name").append(
                  '<span class="error-message">' + data.nameMessage + "</span>"
                );
              }
            }
            if (data.emailStatus === "error") {
              if (message_email.hasClass("val-error") == false) {
                message_email.addClass("val-error");
                $(".form-email").append(
                  '<span class="error-message">' + data.emailMessage + "</span>"
                );
              }
            }
            if (data.messageStatus === "error") {
              if (message_text.hasClass("val-error") == false) {
                message_text.addClass("val-error");
                $(".form-message").append(
                  '<span class="error-message">' +
                    data.messageMessage +
                    "</span>"
                );
              }
            }
          }
        }
      });
    }

    if ($(".batterdocs-anchor").length) {
      // tooltips
      $(".batterdocs-anchor")
        .hover(
          function() {
            var title = $(this).attr("data-title");
            $("<div/>", {
              text: title,
              class: "tooltip-box"
            }).appendTo(this);
          },
          function() {
            // $(document).find("div.tooltip-box").remove();
          }
        )
        .on("click", function(e) {
          // Clipboard
          e.preventDefault();
          var a = new ClipboardJS(".batterdocs-anchor");
          a.on("success", function(e) {
            $(document)
              .find("div.tooltip-box")
              .text(betterdocspublic.copy_text);
            e.clearSelection(),
              $(e.trigger).addClass("copied"),
              setTimeout(function() {
                $(e.trigger).removeClass("copied");
              }, 2000);
          });
        });

      (function() {
        if (typeof self === "undefined" || !self.Prism || !self.document) {
          return;
        }

        if (!Prism.plugins.toolbar) {
          console.warn(
            "Copy to Clipboard plugin loaded before Toolbar plugin."
          );

          return;
        }

        var ClipboardJS = window.ClipboardJS || undefined;

        if (!ClipboardJS && typeof require === "function") {
          ClipboardJS = require("clipboard");
        }

        var callbacks = [];

        if (!ClipboardJS) {
          var script = document.createElement("script");
          var head = document.querySelector("head");

          script.onload = function() {
            ClipboardJS = window.ClipboardJS;

            if (ClipboardJS) {
              while (callbacks.length) {
                callbacks.pop()();
              }
            }
          };

          script.src =
            "https://cdnjs.cloudflare.com/ajax/libs/clipboard.js/2.0.0/clipboard.min.js";
          head.appendChild(script);
        }

        Prism.plugins.toolbar.registerButton("copy-to-clipboard", function(
          env
        ) {
          var linkCopy = document.createElement("button");
          linkCopy.textContent = "Copy";

          if (!ClipboardJS) {
            callbacks.push(registerClipboard);
          } else {
            registerClipboard();
          }

          return linkCopy;

          function registerClipboard() {
            var clip = new ClipboardJS(linkCopy, {
              text: function() {
                return env.code;
              }
            });

            clip.on("success", function() {
              linkCopy.textContent = "Copied!";

              resetText();
            });
            clip.on("error", function() {
              linkCopy.textContent = "Press Ctrl+C to copy";

              resetText();
            });
          }

          function resetText() {
            setTimeout(function() {
              linkCopy.textContent = "Copy";
            }, 5000);
          }
        });
      })();
    }

    //FAQ LOGIC
    $('.betterdocs-faq-post').on('click', function(e) {
      var current_node = $(this);
      var active_list  = $('.betterdocs-faq-group.active');
      
      if( ! current_node.parent().hasClass('active') ) {
        current_node.parent().addClass('active');
        current_node.children('svg').toggle();
        current_node.next().slideDown();
      }

      for( let node of active_list ) {
          if( $(node).hasClass('active') ) {
            $(node).removeClass('active');
            $(node).children('.betterdocs-faq-post').children('svg').toggle();
            $(node).children('.betterdocs-faq-main-content').slideUp();
          }
      }
    });

    //FAQ LOGIC 2 

    $('.betterdocs-faq-post-layout-2').on('click', function(e) {
      var current_node = $(this);

      if( ! current_node.parent().hasClass('active') ) {
        current_node.parent().addClass('active');
        current_node.children('.betterdocs-faq-post-layout-2-icon-group').children('svg').toggle();
        current_node.next().slideDown();
      } else {
        current_node.parent().removeClass('active');
        current_node.children('.betterdocs-faq-post-layout-2-icon-group').children('svg').toggle();
        current_node.next().slideUp();
      }

    });

    $('.betterdocs-feelings').on( 'click', function( e ) {
			e.preventDefault();
			
			var feelings = e.currentTarget.dataset.feelings;
			if( betterdocspublic != undefined &&
				betterdocspublic.FEEDBACK != undefined &&
				betterdocspublic.FEEDBACK.DISPLAY != undefined &&
				betterdocspublic.FEEDBACK.DISPLAY == true ) {
				var URL = betterdocspublic.FEEDBACK.URL + '/' + betterdocspublic.post_id + '&feelings=' + feelings;
				jQuery.ajax({
					url : URL,
					method : 'POST',
					success : function( res ){
						if(res === true) {
							$('.betterdocs-article-reactions-heading,.betterdocs-article-reaction-links').fadeOut(1000);
							$('.betterdocs-article-reactions').html('<p>'+betterdocspublic.FEEDBACK.SUCCESS+'</p>').fadeIn(1000);
						}
					}
				});
			}
		});

  });
})(jQuery);
