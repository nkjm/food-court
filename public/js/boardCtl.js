angular.module("ai-waiter")
.controller("rootCtl", ($scope, $log, $filter, order_list) => {
    $scope.ui = {};
    $scope.ui.order_list = order_list;
});
