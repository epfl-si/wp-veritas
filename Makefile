# wp-veritas' Makefile
SHELL := /bin/bash
VERSION=$(shell jq -r .version app/package.json)

.PHONY: help
help:
	@echo "make help               — Display this help"
	@echo "make meteor             — Run application wp-veritas on localhost"
	@echo "make version            — Get the version number of wp-veritas"
	@echo "make apidoc             — Refresh API documentation"
	@echo "make test               — Run test suite"
	@echo "make version-patch      — Bump wp-veritas version (patch)"
	@echo "make version-minor      — Bump wp-veritas version (minor)"
	@echo "make version-major      — Bump wp-veritas version (major)"
	@echo "make version-special    — Bump wp-veritas to specified version"
	@echo "make publish            — To build, tag and push new Image"
	@echo "make deploy-dev         — To deploy on dev environment"
	@echo "make deploy-test        — To deploy on test environment"
	@echo "make deploy-prod        — To deploy on prod environment"

.PHONY: version
version:
	@echo $(VERSION)

check-env:
ifeq ($(wildcard /keybase/team/epfl_wpveritas/env),)
  @echo "Be sure to have access to /keybase/team/epfl_wpveritas/env"
  @exit 1
else
include /keybase/team/epfl_wpveritas/env
# To add all variable to your shell, use
#export $(xargs < /keybase/team/epfl_wpveritas/env)
endif

.PHONY: apidoc
apidoc:
	@echo Running: npx apidoc --single -i $$(pwd)/app/server/ -o $$(pwd)/app/public/api/ -c $$(pwd)/app/
	@npx apidoc --single -i $$(pwd)/app/server/ -o $$(pwd)/app/public/api/ -c $$(pwd)/app/
	@read -p "Want to see the API Doc? [Yy]: " -n 1 -r; \
	if [[ ! $$REPLY =~ ^[Yy]$$ ]]; then \
		exit; \
	else \
		xdg-open $$(pwd)/app/public/api/index.html; \
	fi

.PHONY: test
test: check-env
	@echo '**** Run test: ****'
	@cd app; env MOCHA_TIMEOUT=$$MOCHA_TIMEOUT WP_VERITAS_BOT_TOKEN=$$WP_VERITAS_BOT_TOKEN_TEST WP_VERITAS_ALERTS_TELEGRAM_IDS=$$WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST TEST_WATCH=1 meteor test --full-app --driver-package meteortesting:mocha --port 3888

.PHONY: meteor
meteor: check-env
	@echo '**** Start meteor: ****'
	cd app/; env WP_VERITAS_BOT_TOKEN=$$WP_VERITAS_BOT_TOKEN_TEST WP_VERITAS_ALERTS_TELEGRAM_IDS=$$WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST meteor --settings meteor-settings.json

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

.PHONY: build
build:
	@echo '**** Start build: ****'
	docker build -t epflsi/wp-veritas .
	@echo '**** End build: ****'

.PHONY: tag
tag:
	@echo '**** Start tag: ****'
	docker tag epflsi/wp-veritas:latest epflsi/wp-veritas:$(VERSION)
	@echo '**** End tag: ****'

.PHONY: push
push:
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
	ansible-playbook playbook.yml -i hosts-dev -vvv
	@echo '**** End deploy: ****'

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
	ansible-playbook playbook.yml -i hosts-test
	@echo '**** End deploy: ****'

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
	ansible-playbook playbook.yml -i hosts-prod
	@echo '**** End deploy: ****'

.PHONY: publish
publish:
	$(MAKE) apidoc
	$(MAKE) build
	$(MAKE) tag
	$(MAKE) push

.PHONY: develop
develop:
	@docker-compose -f docker-compose-dev.yml up
