VERSION := $(shell cat ansible/roles/epfl.wp-veritas/vars/main.yml | grep wp_veritas_image_version: | cut -d' ' -f2 | tr -d \')

.PHONY: test
test:
	@echo $(VERSION)

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

.PHONY: publish
publish:
	$(MAKE) build
	$(MAKE) tag
	$(MAKE) push
