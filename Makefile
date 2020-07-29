# wp-veritas' Makefile
SHELL := /bin/bash

.PHONY: help
help:
	@echo "make help               — Help"
	@echo "make version            — Get the version number of wp-veritas"
	@echo "make version-patch      — Bump wp-veritas version (patch)"
	@echo "make version-minor      — Bump wp-veritas version (minor)"
	@echo "make version-major      — Bump wp-veritas version (major)"
	@echo "make version-special    — Bump wp-veritas to specified version"
	@echo "make publish            — To build, tag and push new Image"
	@echo "make deploy-test        — To deploy on test environment"
	@echo "make deploy-prod        — To deploy on prod environment"

.PHONY: version
version:
	@./change-version.sh -d

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

.PHONY: meteor
meteor:
	@echo '**** Start meteor: ****'
	cd app/; env WP_VERITAS_BOT_TOKEN=$WP_VERITAS_BOT_TOKEN_TEST WP_VERITAS_ALERTS_TELEGRAM_IDS=$WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST meteor --settings meteor-settings.json

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
	$(MAKE) build
	$(MAKE) tag
	$(MAKE) push

.PHONY: develop
develop:
	@docker-compose -f docker-compose-dev.yml up
