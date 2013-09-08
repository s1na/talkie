/* jshint globalstrict: true */
"use strict";

/* Directives */

angular.module('talkie.directives', []).
  directive('appVersion', function (version) {
    return function (scope, elm, attrs) {
      elm.text(version);
    };
  }).
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
  directive('scrollBtm', function () {
    return {
      link: function(scope, elem, attr) {
        scope.$watch('msgs', function() {
          elem[0].scrollTop = elem[0].scrollHeight;
        }, true);
      }
    };
  }).
  directive('getFocus', function () {
    return {
      link: function(scope, elem, attr) {
        if (attr.getFocus) {
          elem[0].focus();
        }
      }
    };
  });
