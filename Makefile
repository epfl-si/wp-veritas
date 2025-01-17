# wp-veritas' Makefile
SHELL := /bin/bash
VERSION=$(shell ./change-version.sh -pv)

.PHONY: help
help:
	@echo "Main:"
	@echo "  make help               — Display this help"
	@echo "  make meteor             — Run application wp-veritas on localhost"
	@echo "Utilities:"
	@echo "  make print-env          — Print the environment variables"
	@echo "  make test               — Run test suite"
	@echo "  make apidoc             — Refresh API documentation"
	@echo "  make prettier           — Prettier all the things"
	@echo "  make prettier-check     — Check if prettier need to be run"
	@echo "Release:"
	@echo "  make version            — Get the version number of wp-veritas"
	@echo "  make version-patch      — Bump wp-veritas version (patch)"
	@echo "  make version-minor      — Bump wp-veritas version (minor)"
	@echo "  make version-major      — Bump wp-veritas version (major)"
	@echo "  make version-special    — Bump wp-veritas to specified version"
	@echo "Publication and deployment:"
	@echo "  make publish            — To build, tag and push new Image"
	@echo "  make deploy-dev         — To deploy on dev environment"
	@echo "  make deploy-test        — To deploy on test environment"
	@echo "  make deploy-prod        — To deploy on prod environment"
	@echo "Development:"
	@echo "  make dev-up             — Brings up Docker services for development"
	@echo "  make dev-build          — Build Docker services for development"
	@echo "  make dev-build-force    — Force build Docker services for development"
	@echo "  make dev-exec           — Enter the meteor container"
	@echo "  make dev-cli            — Install veritas-cli in the meteor container"
	@echo "  make dev-data           — load-tests-data-on-localhost-db"

# To add all variable to your shell, use
# export $(xargs < /keybase/team/epfl_wpveritas/env);
check-env:
ifeq ($(wildcard /keybase/team/epfl_wpveritas/env),)
	@echo "Be sure to have access to /keybase/team/epfl_wpveritas/env"
	@exit 1
else
include /keybase/team/epfl_wpveritas/env
endif

print-env: check-env
	@echo "WP_VERITAS_DB_PASSWORD_DEV=${WP_VERITAS_DB_PASSWORD_DEV}"
	@echo "WP_VERITAS_DB_PASSWORD_TEST=${WP_VERITAS_DB_PASSWORD_TEST}"
	@echo "WP_VERITAS_DB_PASSWORD_PROD=${WP_VERITAS_DB_PASSWORD_PROD}"
	@echo "WP_VERITAS_BOT_TOKEN_TEST=${WP_VERITAS_BOT_TOKEN_TEST}"
	@echo "WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST=${WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST}"
	@echo "WP_VERITAS_BOT_TOKEN=${WP_VERITAS_BOT_TOKEN}"
	@echo "WP_VERITAS_ALERTS_TELEGRAM_IDS=${WP_VERITAS_ALERTS_TELEGRAM_IDS}"
	@echo "WP_VERITAS_AWX_TOKEN=${AWX_TOKEN}"
	@echo "MOCHA_TIMEOUT=${MOCHA_TIMEOUT}"

.PHONY: meteor
meteor: check-env app/packages/meteor-synced-cron
	@echo '**** Start meteor: ****'
	cd app/; env WP_VERITAS_BOT_TOKEN=$$WP_VERITAS_BOT_TOKEN_TEST WP_VERITAS_ALERTS_TELEGRAM_IDS=$$WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST WP_VERITAS_AWX_TOKEN=$$AWX_TOKEN meteor --settings meteor-settings.json

.PHONY: test
test: check-env app/packages/meteor-synced-cron
	@echo '**** Run test: ****'
	@cd app; env MOCHA_TIMEOUT=$$MOCHA_TIMEOUT WP_VERITAS_BOT_TOKEN=$$WP_VERITAS_BOT_TOKEN_TEST WP_VERITAS_ALERTS_TELEGRAM_IDS=$$WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST TEST_WATCH=1 meteor test --full-app --driver-package meteortesting:mocha --port 3888

.PHONY: apidoc
apidoc:
	@echo Running: npx apidoc --single -i $$(pwd)/app/server/ -o $$(pwd)/app/public/api/ -c $$(pwd)/app/apidoc.json
	@npx apidoc --single -i $$(pwd)/app/server/ -o $$(pwd)/app/public/api/ -c $$(pwd)/app/apidoc.json
	xdg-open $$(pwd)/app/public/api/index.html;

.PHONY: prettier-check
prettier-check:
	npx prettier --check "app/{client, private, server, tests}/**/*.js"
	npx prettier --check "cli/**/*.js"
	npx prettier --check "test/**/*.js"

.PHONY: prettier
prettier:
	npx prettier --write "app/{client, private, server, tests}/**/*.js"
	npx prettier --write "cli/**/*.js"
	npx prettier --write "test/**/*.js"

.PHONY: version
version:
	@echo $(VERSION)

.PHONY: version-patch
version-patch:
	@./change-version.sh -a

.PHONY: version-minor
version-minor:
	@./change-version.sh -a -v minor

.PHONY: version-major
version-major:
	@./change-version.sh -a -v major

.PHONY: version-special
version-special:
	@if test "$(WP_VERITAS_VERSION)" = "" ; then \
		echo "Please set WP_VERITAS_VERSION, example:"; \
		echo "  make version-special WP_VERITAS_VERSION=3.2.1"; \
		exit 1; \
	fi
	@echo "Change version to $$WP_VERITAS_VERSION"
	@./change-version.sh -a -v $$WP_VERITAS_VERSION

.PHONY: docker-build
docker-build:
	@echo '**** Start build: ****'
	docker build -t epflsi/wp-veritas .
	@echo '**** End build: ****'

.PHONY: docker-tag
docker-tag:
	@echo '**** Start tag: ****'
	docker tag epflsi/wp-veritas:latest epflsi/wp-veritas:$(VERSION)
	@echo '**** End tag: ****'

.PHONY: docker-push
docker-push:
	@echo '**** Start push: ****'
	docker push epflsi/wp-veritas:$(VERSION)
	docker push epflsi/wp-veritas:latest
	@echo '**** End push: ****'

.PHONY: deploy-dev
deploy-dev:
	@echo '**** Start deploy: ****'
	if [ -z "$$(oc project)" ]; then \
		echo "pas loggué"; \
		oc login; \
	else \
		echo "loggué"; \
	fi
	cd ansible/; \
	export $$(xargs < /keybase/team/epfl_wpveritas/env); \
	ansible-playbook playbook.yml -i hosts-dev -vvv
	@echo '**** End deploy: ****'
	@echo 'https://wp-veritas.128.178.222.83.nip.io'

.PHONY: deploy-test
deploy-test:
	@echo '**** Start deploy: ****'
	if [ -z "$$(oc project)" ]; then \
		echo "pas loggué"; \
		oc login; \
	else \
		echo "loggué"; \
	fi
	cd ansible/; \
	export $$(xargs < /keybase/team/epfl_wpveritas/env); \
	ansible-playbook playbook.yml -i hosts-test
	@echo '**** End deploy: ****'
	@echo 'https://wp-veritas-test.epfl.ch'

.PHONY: deploy-prod
deploy-prod:
	@echo '**** Start deploy: ****'
	if [ -z "$$(oc project)" ]; then \
		echo "pas loggué"; \
		oc login; \
	else \
		echo "loggué"; \
	fi
	cd ansible/; \
	export $$(xargs < /keybase/team/epfl_wpveritas/env); \
	ansible-playbook playbook.yml -i hosts-prod
	@echo '**** End deploy: ****'
	@echo 'https://wp-veritas.epfl.ch'

.PHONY: git-tag
git-tag:
	git tag -a v$(VERSION) -m v$(VERSION)

.PHONY: publish
publish:
	@read -p "Want to bump the version? [Yy]: " -n 1 -r; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		exit; \
	else \
		make version-minor; \
	fi
	$(MAKE) apidoc
	$(MAKE) docker-build
	$(MAKE) docker-tag
	$(MAKE) docker-push
	$(MAKE) git-tag

app/packages/meteor-synced-cron:
	@mkdir -p $(dir $@) || true
	cd $(dir $@); git clone -b update-to-async git@github.com:sebastianspiller/meteor-synced-cron.git

################################################################################
# Targets for development purpose only                                         #
################################################################################
.PHONY: dev-up
dev-up: check-env
	@docker compose -f docker-compose-dev.yml up

.PHONY: dev-build
dev-build: check-env
	@docker compose -f docker-compose-dev.yml build

.PHONY: dev-build-force
dev-build-force: check-env
	@docker compose -f docker-compose-dev.yml build --force-rm --no-cache --pull

.PHONY: dev-exec
dev-exec:
	@docker exec -it --user root wp-veritas_meteor bash

.PHONY: dev-cli
dev-cli:
	@docker exec -it --user root wp-veritas_meteor /bin/bash -c "cd /src/cli && npm install && npm install -g ./ && cd /src/ && veritas-cli --help"

.PHONY: dev-data
dev-data: dev-cli
	@docker exec -it --user root wp-veritas_meteor /bin/bash -c "cd /src && veritas-cli load-tests-data-on-localhost-db"
