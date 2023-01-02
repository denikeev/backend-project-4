install:
	npm ci

lint:
	npx eslint .

link:
	npm link

test:
	NODE_OPTIONS=--experimental-vm-modules DEBUG=page-loader npx jest

test-coverage:
	NODE_OPTIONS=--experimental-vm-modules npx jest --coverage

test-watch:
	NODE_OPTIONS=--experimental-vm-modules DEBUG=page-loader npx jest --watch