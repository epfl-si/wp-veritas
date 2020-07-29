SHELL := /bin/bash
VERSION := $(shell cat ansible/roles/epfl.wp-veritas/vars/main.yml | grep wp_veritas_image_version: | cut -d' ' -f2 | tr -d \')


.PHONY: help
help:
	@echo "make help:            Help"
	@echo "make version:         Get the version number of wp-veritas"
	@echo "make meteor:          Start application on localhost"
	@echo "make publish:         To build, tag and push new Image"
	@echo "make deploy-dev:      To deploy on dev environment"
	@echo "make deploy-test:     To deploy on test environment"
	@echo "make deploy-prod:     To deploy on prod environment"

.PHONY: version
version:
	@echo $(VERSION)

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
