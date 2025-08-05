(() => {
  const HTML = document.querySelector('#datepicker-injection');
  const data = HTML.getAttribute('data');

  $('#datepicker').val(data).trigger('changeDate');
})();
