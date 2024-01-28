import {
	mergeMap,
	fromEvent,
	startWith,
	map,
	mergeWith,
	shareReplay,
	tap,
	from,
	zipWith,
} from 'rxjs';

const e_refreshButton = document.querySelector('.refresh');
const refreshClick$ = fromEvent(e_refreshButton, 'click');

const request$ = refreshClick$.pipe(
	// we use startWith to also trigger on page load;
	// no need to imitate a real event object,we just need some value (it will be remapped later in map operator anyway)
	startWith(null),
	// now we need to map each click to some url
	map(() => `https://api.github.com/users?since=${getRandomOffset()}`)
);

const response$ = request$.pipe(
	mergeMap((url) => fetch(url)),
	mergeMap((response) => response.json()),
	tap(console.log),
	shareReplay(1) // make our observable multicast to not trigger the request each time we subscribe to response$
	// this also avoids executing fromEvent 3 times that would lead to addition of 3 event listeners for refresh button
);

response$.subscribe();

/* stage 3
To implement independent renewal of suggestions, we need to: 
*/
const suggestionEls = ['.suggestion1', '.suggestion2', '.suggestion3'];

// TODO Clicking on individual close buttons doesn't work!

// from(['.close1', '.close2', '.close3'])
// 	.pipe(
// 		map((selector) => document.querySelector(selector)), // find button elements
// 		map((element) => fromEvent(element, 'click')), // create individual click stream for each one
// 		mergeMap((closeClick$) => createSuggestionStream(closeClick$)), // each click stream must yield individual suggestion stream
// 		// startWith(null),
// 		// mergeMap((_) => response$),
// 		// map((usersList) => getRandomUser(usersList)),
// 		// mergeWith(refreshClick$.pipe(map(() => null))),
// 		zipWith(from(suggestionEls)), // this is the way to get back our suggestionEls names into the pipe when we need them
// 		tap(([suggestedUser, suggestionEl]) =>
// 			renderSuggestion(suggestedUser, suggestionEl)
// 		)
// 	)
// 	.subscribe();

// we can use a common function to create suggestion streams
function createSuggestionStream(closeClick$) {
	return closeClick$.pipe(
		startWith(null),
		mergeMap((_) => response$),
		map((usersList) => getRandomUser(usersList)),
		mergeWith(refreshClick$.pipe(map(() => null))) // mapTo
		/* 
		we need 'mergeWith' refreshClick$ to immediately clear the list when 'refresh' button is pressed
		instead of waiting until request will be executed
		the difference is noticeable if we enable network throttling

		we also add corresponding check to renderSuggestion function to hide it
		if (suggestedUser === null) 
		*/
	);
}

// UTILITY FUNCTIONS

function getRandomUser(usersList) {
	return usersList[Math.floor(Math.random() * usersList.length)];
}

function getRandomOffset() {
	return Math.floor(Math.random() * 500);
}

function renderSuggestion(suggestedUser, selector) {
	console.log(suggestedUser, selector);

	const suggestion_el = document.querySelector(selector);

	if (suggestedUser === null) {
		suggestion_el.style.visibility = 'hidden';
	} else {
		suggestion_el.style.visibility = 'visible';

		const username_el = suggestion_el.querySelector('.username');
		username_el.href = suggestedUser.html_url;
		username_el.textContent = suggestedUser.login;

		const img_el = suggestion_el.querySelector('img');
		img_el.src = suggestedUser.avatar_url;
	}
}
