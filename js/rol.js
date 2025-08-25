(function () {
  try {
    var s = sessionStorage.getItem('session');
    var role = 'guest';
    if (s) role = (JSON.parse(s).role) || 'guest';
    document.documentElement.setAttribute('data-role', role); // driver | client | guest
  } catch (e) {
    document.documentElement.setAttribute('data-role', 'guest');
  }
})();