import store from 'store2';

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
  const storageKey = '_constructorio_is_human';
  const isHumanStorage = !!store.session.get(storageKey);
  let isHumanBoolean = isHumanStorage || false;

  // Humanity proved, remove handlers to prove humanity
  const remove = () => {
    isHumanBoolean = true;

    store.session.set(storageKey, true);
    humanEvents.forEach((eventType) => {
      window.removeEventListener(eventType, remove, true);
    });
  };

  // Add handlers to prove humanity
  if (!isHumanBoolean) {
    humanEvents.forEach((eventType) => {
      window.addEventListener(eventType, remove, true);
    });
  }

  return {
    // Return boolean indicating if is human
    isHuman: () => isHumanBoolean || !!store.session.get(storageKey),
  };
}
