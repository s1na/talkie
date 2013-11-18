var timeDifference = function (first, second) {
  if (!second || typeof second === undefined) {
    second = new Date(Date.now());
  }
  var remaining = new Date(first - second);
  remaining = remaining.getTime();

  var days = Math.floor(remaining / 1000 / 60 / 60 / 24);
  remaining -= days * 1000 * 60 * 60 * 24;

  var hours = Math.floor(remaining / 1000 / 60 / 60);
  remaining -= hours * 1000 * 60 * 60;

  var minutes = Math.floor(remaining / 1000 / 60);
  remaining -= minutes * 1000 * 60;

  var seconds = Math.floor(remaining / 1000);

  var output = '';
  if (days) output = days + 'روز ';
  if (hours) output = output + hours + 'ساعت ';
  if (minutes) output = output + minutes + 'دقیقه ';
  if (seconds) output = output + seconds + 'ثانیه';

  return output;
}

module.exports = {
  timeDifference: timeDifference,
};
