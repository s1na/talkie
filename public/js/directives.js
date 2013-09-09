/* jshint globalstrict: true */
"use strict";

/* Directives */

angular.module('talkie.directives', []).
  directive('retPressed', function () {
    return {
      restrict: 'A',
      link: function(scope, elem, attr) {
        elem.bind('keypress', function (e) {
          if (elem[0].value) {
            if (e.keyCode == 13) {
              if (!e.shiftKey) {
                e.preventDefault();
                scope.$apply(function (s) {
                  s.$eval(attr.retPressed);
                });
              }
            }
          }
        });
      }};
  }).
  directive('scrollBtm', ['$window', function ($window) {
    return {
      link: function(scope, elem, attr) {
        scope.$watch('msg.msgs', function() {
          $window.setTimeout(function () {
            elem[0].scrollTop = elem[0].scrollHeight;
          }, 1);
        }, true);
      }
    };
  }]).
  directive('getFocus', function () {
    return {
      link: function(scope, elem, attr) {
        if (attr.getFocus) {
          elem[0].focus();
        }
      }
    };
  });
