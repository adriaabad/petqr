import { GitHubPublisher, type Publication } from './github';
import { parseDeployment, repositoryName, tokenCreationURL, type Deployment } from './deployment';
import { parseConfig, publicConfig, type Config, type Language } from './model';
import { publicFiles, type ImageFiles } from './public-files';
import { esc } from './render';
import { pt } from './publishing-i18n';

interface Options {
  base: URL;
  deployment: unknown;
  language: () => Language;
  draft: () => Config;
  images: () => ImageFiles;
  onError: (error: unknown) => void;
  onSaved: () => void;
}
export class PublishingUI {
  #client = new GitHubPublisher();
  #root: HTMLElement | null = null;
  #timer: ReturnType<typeof setTimeout> | undefined;
  #status = '';
  #busy = false;
  #actionURL = '';
  #deployment: Deployment | null = null;
  #monitor: AbortController | null = null;
  constructor(private options: Options) {
    try {
      this.#deployment = parseDeployment(options.deployment);
    } catch {
      /* Existing local editor still works when publishing metadata is unavailable. */
    }
    window.addEventListener('pagehide', () => this.disconnect());
  }
  #tr(key: string): string {
    return pt(key, this.options.language());
  }
  mount(root: HTMLElement): void {
    this.#root = root;
    this.#render();
  }
  #render(): void {
    if (!this.#root?.isConnected) return;
    const connection = this.#client.connection;
    this.#root.innerHTML = `<div class="publishing-buttons"><button type="button" class="button primary" data-github-save ${this.#busy ? 'disabled' : ''}>${this.#tr(this.#busy ? 'Saving…' : 'Save and publish')}</button>${connection ? `<button type="button" class="button subtle" data-github-disconnect ${this.#busy ? 'disabled' : ''}>${this.#tr('Disconnect GitHub')}</button>` : `<button type="button" class="button subtle" data-github-connect ${this.#busy ? 'disabled' : ''}>${this.#tr('Connect GitHub')}</button>`}</div><p class="hint publishing-status" role="status">${connection ? `${this.#tr('Connected as')} ${esc(connection.login)} · ` : ''}${esc(this.#tr(this.#status))}${this.#actionURL ? ` <a href="${esc(this.#actionURL)}" target="_blank" rel="noopener noreferrer">${this.#tr('View publication')}</a>` : ''}</p>`;
    this.#root.querySelector<HTMLButtonElement>('[data-github-save]')!.onclick = () => {
      void this.save().catch(this.options.onError);
    };
    const connect = this.#root.querySelector<HTMLButtonElement>('[data-github-connect]');
    if (connect) connect.onclick = () => this.#connect();
    const disconnect = this.#root.querySelector<HTMLButtonElement>('[data-github-disconnect]');
    if (disconnect) disconnect.onclick = () => this.disconnect();
  }
  disconnect(): void {
    clearTimeout(this.#timer);
    this.#monitor?.abort();
    this.#client.disconnect();
    this.#status = 'Disconnected. The access key was forgotten by this tab.';
    this.#render();
  }
  #dialog(title: string, body: string): HTMLDialogElement {
    const dialog = document.createElement('dialog');
    dialog.setAttribute('aria-label', this.#tr(title));
    dialog.innerHTML = `<div class="modal-heading"><h2>${this.#tr(title)}</h2><button type="button" class="button" data-close>${this.#tr('Close')}</button></div>${body}`;
    dialog.querySelector<HTMLElement>('[data-close]')!.onclick = () => dialog.close();
    dialog.onclose = () => {
      dialog
        .querySelectorAll<HTMLInputElement>('input[type=password]')
        .forEach((input) => (input.value = ''));
      dialog.remove();
    };
    document.body.append(dialog);
    dialog.showModal();
    return dialog;
  }
  #connect(after?: () => void): void {
    if (!isSecureContext) {
      this.options.onError(new Error(this.#tr('Use HTTPS or localhost before connecting GitHub.')));
      return;
    }
    if (!this.#deployment) {
      this.options.onError(
        new Error(this.#tr('Reload the editor to get safe publishing information.')),
      );
      return;
    }
    const deployment = this.#deployment;
    const dialog = this.#dialog(
      'Connect GitHub',
      `<p>${this.#tr('GitHub Pages has no login server. Use a temporary fine-grained access key restricted to your repository. The key stays only in this tab for 30 minutes and is never saved in files or browser storage.')}</p><div class="spacer"></div><form class="stack" autocomplete="off"><label>${this.#tr('Repository')}<input name="repository" value="${esc(deployment.repository || '')}" ${deployment.repository ? 'readonly' : ''} required placeholder="owner/name" maxlength="200" autocapitalize="off" spellcheck="false"></label><p class="hint">${this.#tr('In GitHub choose Only select repositories, select the repository shown here, and allow only Contents: Read and write. Use a short expiration. Do not enable access to all repositories.')}</p><a class="button" data-create-key href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener noreferrer">${this.#tr('Create a limited access key in GitHub')}</a><label>${this.#tr('Temporary access key')}<input name="key" type="password" required autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="github_pat_…"></label><label class="check"><input name="limited" type="checkbox" required>${this.#tr('I selected only this repository and Contents: Read and write.')}</label><div class="row"><button class="button primary" type="submit">${this.#tr('Connect')}</button><a href="https://github.com/settings/personal-access-tokens" target="_blank" rel="noopener noreferrer">${this.#tr('Manage or revoke keys')}</a></div><p class="field-error" data-error role="alert"></p></form>`,
    );
    const repository = dialog.querySelector<HTMLInputElement>('[name=repository]')!,
      key = dialog.querySelector<HTMLInputElement>('[name=key]')!,
      form = dialog.querySelector('form')!,
      error = dialog.querySelector<HTMLElement>('[data-error]')!;
    function updateLink() {
      try {
        dialog.querySelector<HTMLAnchorElement>('[data-create-key]')!.href = tokenCreationURL(
          repository.value,
        );
      } catch {
        dialog.querySelector<HTMLAnchorElement>('[data-create-key]')!.removeAttribute('href');
      }
    }
    repository.oninput = updateLink;
    updateLink();
    let connecting = false,
      connected = false;
    dialog.addEventListener('close', () => {
      if (connecting && !connected) this.#client.disconnect();
    });
    form.onsubmit = async (event) => {
      event.preventDefault();
      if (connecting || !form.reportValidity()) return;
      let secret = key.value.trim();
      key.value = '';
      connecting = true;
      error.textContent = '';
      form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled = true;
      try {
        repositoryName(repository.value);
        await this.#client.connect(secret, repository.value, deployment);
        secret = '';
        if (!dialog.open) {
          this.#client.disconnect();
          return;
        }
        connected = true;
        clearTimeout(this.#timer);
        this.#timer = setTimeout(
          () => {
            this.#client.disconnect();
            this.#status = 'The editor connection expired. Connect again.';
            this.#render();
          },
          30 * 60 * 1000,
        );
        this.#status = 'Access key kept only in this tab.';
        this.#render();
        dialog.close();
        after?.();
      } catch (problem) {
        error.textContent = this.#tr(
          problem instanceof Error
            ? problem.message
            : 'Could not reach GitHub. Your draft is still here. Try again.',
        );
      } finally {
        secret = '';
        connecting = false;
        if (dialog.open)
          form.querySelector<HTMLButtonElement>('button[type=submit]')!.disabled = false;
      }
    };
  }
  async save(): Promise<void> {
    if (this.#busy) return;
    parseConfig(this.options.draft());
    if (!this.#client.connection) {
      this.#connect(() => {
        void this.save().catch(this.options.onError);
      });
      return;
    }
    const snapshot = structuredClone(this.options.draft()),
      safe = publicConfig(snapshot),
      connection = this.#client.connection!;
    const dialog = this.#dialog(
      'Save and publish',
      `<p><strong>${esc(connection.repository)}</strong> · ${esc(connection.branch)}</p><div class="spacer"></div><div class="notice warning">${this.#tr('Only selected public information and referenced photos will be sent to GitHub. Unpublished fields stay in this browser. Published data and repository history are public.')}</div><div class="spacer"></div><p>${safe.pets.length} ${this.#tr('My pets')} · ${safe.contacts.length} ${this.#tr('Contacts')} · ${safe.pets.reduce((count, pet) => count + pet.photos.length, 0)} ${this.#tr('Photos')}</p><p class="hint">${this.#tr('Data and photos are saved together in one commit. The website updates after GitHub Actions finishes. Newer remote changes will never be overwritten automatically.')}</p><div class="qr-output-actions"><button type="button" class="button primary" data-publish>${this.#tr('Publish changes')}</button></div><p data-progress role="status"></p><p class="field-error" data-error role="alert"></p>`,
    );
    const button = dialog.querySelector<HTMLButtonElement>('[data-publish]')!,
      progress = dialog.querySelector<HTMLElement>('[data-progress]')!,
      error = dialog.querySelector<HTMLElement>('[data-error]')!;
    button.onclick = async () => {
      if (this.#busy) return;
      this.#busy = true;
      button.disabled = true;
      dialog.querySelector<HTMLButtonElement>('[data-close]')!.disabled = true;
      this.#render();
      error.textContent = '';
      progress.textContent = this.#tr('Saving public data and photos to GitHub…');
      const preventClose = (event: Event) => event.preventDefault();
      dialog.addEventListener('cancel', preventClose);
      try {
        // Keep automatic Pages URL detection in source, so template copies do not inherit this account.
        if (
          this.#deployment?.configuredPublicUrl === '' &&
          snapshot.site.publicUrl === this.#deployment.resolvedPublicUrl
        )
          snapshot.site.publicUrl = '';
        const publication = await this.#client.publish(
          await publicFiles(snapshot, this.options.images(), this.options.base),
        );
        if (!publication) {
          this.#status = 'No public changes to publish.';
          dialog.close();
          return;
        }
        this.#deployment!.dataShas = { ...publication.dataShas };
        this.#deployment!.photoShas = { ...publication.photoShas };
        this.#deployment!.commit = publication.commit;
        this.#actionURL = publication.url;
        this.#status = 'Saved in GitHub. The website is updating.';
        this.options.onSaved();
        dialog.close();
        void this.#watch(publication);
      } catch (problem) {
        error.textContent = this.#tr(
          problem instanceof Error
            ? problem.message
            : 'GitHub could not save the changes. Your draft is still here.',
        );
        progress.textContent = '';
      } finally {
        this.#busy = false;
        dialog.removeEventListener('cancel', preventClose);
        if (dialog.open) {
          button.disabled = false;
          dialog.querySelector<HTMLButtonElement>('[data-close]')!.disabled = false;
        }
        this.#render();
      }
    };
  }
  async #watch(publication: Publication): Promise<void> {
    this.#monitor?.abort();
    const monitor = new AbortController();
    this.#monitor = monitor;
    for (let attempt = 0; attempt < 48 && !monitor.signal.aborted; attempt++) {
      try {
        const url = new URL('data/deployment.json', this.options.base);
        url.searchParams.set('publication', `${publication.commit}-${Date.now()}`);
        const response = await fetch(url, {
          cache: 'no-store',
          credentials: 'omit',
          signal: AbortSignal.any([monitor.signal, AbortSignal.timeout(10000)]),
        });
        if (response.ok) {
          const live = parseDeployment(await response.json());
          if (
            live.commit === publication.commit ||
            (Object.entries(publication.dataShas).every(
              ([path, sha]) => live.dataShas[path] === sha,
            ) &&
              Object.entries(publication.photoShas).every(
                ([path, sha]) => live.photoShas[path] === sha,
              ))
          ) {
            this.#status = 'Published. The website now includes your changes.';
            this.#render();
            return;
          }
        }
      } catch {
        /* A saved commit remains safe while Pages deploys or the connection is temporarily offline. */
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
    if (!monitor.signal.aborted) {
      this.#status =
        'Saved in GitHub. Deployment is still pending or needs attention. Check the publication.';
      this.#render();
    }
  }
}
