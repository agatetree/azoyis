# AzoyIs portfolio

This package is ready for GitHub and Vercel. It includes the public portfolio,
contact form, private administrator login, and project add/edit/remove/reorder tools.

## Deploy to Vercel

1. Create a new empty GitHub repository.
2. Upload every file and folder from this package to the repository.
3. In Vercel, choose **Add New Project**, import the repository, and deploy it as a Next.js project.
4. In the Vercel project, open **Storage** and add a Postgres database from the Marketplace. Vercel will add `POSTGRES_URL` automatically.
5. In **Settings > Environment Variables**, add:
   - `ADMIN_SESSION_SECRET`: a long random value of at least 32 characters.
   - `ADMIN_SETUP_EMAIL`: the email you want to use for administrator login.
   - `ADMIN_SETUP_KEY`: a private one-time setup key you choose.
   - `CONTACT_TO_EMAIL`: the private email that should receive contact messages.
6. Redeploy after adding the environment variables.
7. Open `/admin/setup` on your deployed domain. Enter the owner email, the private setup key, and the admin password you want to use.
8. After setup, use `/admin` to manage projects.

The email, setup key, database password, session secret, and admin password are
server-side. Visitors cannot see them by inspecting the website source.

## Contact form

The contact form sends through FormSubmit to `CONTACT_TO_EMAIL`. The first message
may trigger an activation email from FormSubmit. Open that email and approve the
form once. The form will then deliver future messages normally from your domain.

## Custom domain

After the Vercel deployment works, add `azoyis.com` under **Settings > Domains**.
Vercel will show the exact DNS records to enter at your domain provider.

## Local development

Copy `.env.example` to `.env.local`, fill in the values, then run:

```bash
npm install
npm run dev
```
