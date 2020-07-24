SHELL := bash
VERSION := $(shell cat ansible/roles/epfl.wp-veritas/vars/main.yml | grep wp_veritas_image_version: | cut -d' ' -f2 | tr -d \')

.PHONY: help
help:
	@echo "make help:            Help"
	@echo "make version:         Get the version number of wp-veritas"
	@echo "make apidoc:          Refresh API documentation"
	@echo "make test:            Run test suit"
	@echo "make meteor:          Run app in http://localhost:3000"
	@echo "make publish:         To build, tag and push new Image"
	@echo "make deploy-test:     To deploy on test environment"
	@echo "make deploy-prod:     To deploy on prod environment"

.PHONY: version
version:
	@echo $(VERSION)


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
test:
	@echo '**** Run test: ****'
	@cd app; env WP_VERITAS_BOT_TOKEN=$WP_VERITAS_BOT_TOKEN_TEST WP_VERITAS_ALERTS_TELEGRAM_IDS=$WP_VERITAS_ALERTS_TELEGRAM_IDS_TEST TEST_WATCH=1 meteor test --full-app --driver-package meteortesting:mocha --port 3888

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
