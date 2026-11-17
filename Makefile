# Runs locally the same steps as the "Typecheck, tests and build" job of .github/workflows/pr.yml.
#   make          install, typecheck, test, build (the CI build job)
#   make check    same without `npm ci` (keeps your node_modules)
#   make pages    build and serve dist/ as a static site
NODE_MIN := 20

.DEFAULT_GOAL := ci
.PHONY: ci check install node typecheck test build pages clean help

ci: install check ## What the CI "check" job runs

check: node typecheck test build ## CI steps except `npm ci`

node: ## Fail if Node is older than the version the workflow uses
	@v=$$(node -p 'process.versions.node.split(".")[0]'); \
	if [ "$$v" -lt $(NODE_MIN) ]; then echo "Node $(NODE_MIN)+ required (found $$v)"; exit 1; fi

install: node ## npm ci (wipes and reinstalls node_modules from the lockfile)
	npm ci

typecheck: ## npm run typecheck
	npm run typecheck

test: ## npm test
	npm test

build: ## npm run build (relative base: dist/ works on any domain or sub-path)
	npm run build

pages: build ## Serve dist/ the way a static host would
	npx vite preview

clean: ## Remove build output and the incremental tsc cache
	rm -rf dist tsconfig.tsbuildinfo

help: ## List targets
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | sed 's/:.*## /\t/'
