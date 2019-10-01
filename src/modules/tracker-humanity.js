const humanEvents = [
  'scroll',
  'resize',
  'touchmove',
  'mouseover',
  'mousemove',
  'keydown',
  'keypress',
  'keyup',
  'focus',
];

export default function trackerHumanity() {
  let isHumanBoolean = false;

  // Humanity proved, remove handlers to prove humanity
  const remove = () => {
    isHumanBoolean = true;

    humanEvents.forEach((eventType) => {
      window.removeEventListener(eventType, remove, true);
    });
  };

  // Add handlers to prove humanity
  humanEvents.forEach((eventType) => {
    window.addEventListener(eventType, remove, true);
  });

  return {
    // Return boolean indicating if is human
    isHuman: () => isHumanBoolean,
  };
}
