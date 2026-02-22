-- RLS + Policies
begin;

alter table public."orgs" enable row level security;
alter table public."profiles" enable row level security;
alter table public."project_members" enable row level security;
alter table public."projects" enable row level security;
alter table public."time_entries" enable row level security;
alter table public.audit_log enable row level security;
drop policy if exists "orgs_select_own" on public."orgs";
create policy "orgs_select_own" on public."orgs" for select to authenticated using ((id = current_org_id()));
drop policy if exists "profiles_select_manager_reports" on public."profiles";
create policy "profiles_select_manager_reports" on public."profiles" for select to authenticated using ((("current_role"() = 'manager'::text) AND (org_id = current_org_id()) AND (manager_id = auth.uid())));
drop policy if exists "profiles_select_own" on public."profiles";
create policy "profiles_select_own" on public."profiles" for select to authenticated using ((id = auth.uid()));
drop policy if exists "profiles_select_safe" on public."profiles";
create policy "profiles_select_safe" on public."profiles" for select to public using (((id = auth.uid()) OR (is_admin() AND (org_id = current_org_id()))));
drop policy if exists "profiles_update_admin_org" on public."profiles";
create policy "profiles_update_admin_org" on public."profiles" for update to authenticated using ((("current_role"() = 'admin'::text) AND (org_id = current_org_id()))) with check ((("current_role"() = 'admin'::text) AND (org_id = current_org_id())));
drop policy if exists "profiles_update_manager_team" on public."profiles";
create policy "profiles_update_manager_team" on public."profiles" for update to public using (((org_id = current_org_id()) AND is_admin_or_manager() AND (("current_role"() = 'admin'::text) OR (manager_id = auth.uid())))) with check (((org_id = current_org_id()) AND is_admin_or_manager() AND (("current_role"() = 'admin'::text) OR (manager_id = auth.uid()))));
drop policy if exists "profiles_update_own" on public."profiles";
create policy "profiles_update_own" on public."profiles" for update to authenticated using ((id = auth.uid())) with check ((id = auth.uid()));
drop policy if exists "pm_admin_manager_delete" on public."project_members";
create policy "pm_admin_manager_delete" on public."project_members" for delete to authenticated using (((org_id = current_org_id()) AND is_admin_or_manager()));
drop policy if exists "pm_admin_manager_write" on public."project_members";
create policy "pm_admin_manager_write" on public."project_members" for insert to authenticated with check (((org_id = current_org_id()) AND is_admin_or_manager()));
drop policy if exists "pm_insert" on public."project_members";
create policy "pm_insert" on public."project_members" for insert to public with check ((is_admin() AND (org_id = current_org_id())));
drop policy if exists "pm_select" on public."project_members";
create policy "pm_select" on public."project_members" for select to public using (((is_admin() AND (org_id = current_org_id())) OR (profile_id = auth.uid())));
drop policy if exists "pm_update" on public."project_members";
create policy "pm_update" on public."project_members" for update to public using ((is_admin() AND (org_id = current_org_id()))) with check ((is_admin() AND (org_id = current_org_id())));
drop policy if exists "projects_admin_delete" on public."projects";
create policy "projects_admin_delete" on public."projects" for delete to authenticated using (((org_id = current_org_id()) AND ("current_role"() = 'admin'::text)));
drop policy if exists "projects_admin_manager_insert" on public."projects";
create policy "projects_admin_manager_insert" on public."projects" for insert to authenticated with check (((org_id = current_org_id()) AND is_admin_or_manager()));
drop policy if exists "projects_admin_manager_update" on public."projects";
create policy "projects_admin_manager_update" on public."projects" for update to authenticated using (((org_id = current_org_id()) AND is_admin_or_manager())) with check (((org_id = current_org_id()) AND is_admin_or_manager()));
drop policy if exists "projects_select_org" on public."projects";
create policy "projects_select_org" on public."projects" for select to authenticated using (((org_id = current_org_id()) AND (is_admin_or_manager() OR (EXISTS ( SELECT 1
   FROM project_members pm
  WHERE ((pm.project_id = projects.id) AND (pm.user_id = auth.uid())))))));
drop policy if exists "projects_update_admin_manager" on public."projects";
create policy "projects_update_admin_manager" on public."projects" for update to public using (((org_id = ( SELECT profiles.org_id
   FROM profiles
  WHERE (profiles.id = auth.uid()))) AND (( SELECT profiles.role
   FROM profiles
  WHERE (profiles.id = auth.uid())) = ANY (ARRAY['admin'::text, 'manager'::text]))));
drop policy if exists "te_insert_own" on public."time_entries";
create policy "te_insert_own" on public."time_entries" for insert to authenticated with check (((org_id = current_org_id()) AND (user_id = auth.uid()) AND (is_admin_or_manager() OR (EXISTS ( SELECT 1
   FROM project_members pm
  WHERE ((pm.project_id = time_entries.project_id) AND (pm.user_id = auth.uid())))))));
drop policy if exists "te_manager_approve" on public."time_entries";
create policy "te_manager_approve" on public."time_entries" for update to public using (((("current_role"() = 'admin'::text) AND (org_id = current_org_id())) OR (("current_role"() = 'manager'::text) AND (user_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.manager_id = auth.uid())))))) with check (((("current_role"() = 'admin'::text) AND (org_id = current_org_id())) OR (("current_role"() = 'manager'::text) AND (user_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.manager_id = auth.uid()))))));
drop policy if exists "te_select" on public."time_entries";
create policy "te_select" on public."time_entries" for select to public using (((user_id = auth.uid()) OR (("current_role"() = 'admin'::text) AND (org_id = current_org_id())) OR (("current_role"() = 'manager'::text) AND (user_id IN ( SELECT p.id
   FROM profiles p
  WHERE (p.manager_id = auth.uid()))))));
drop policy if exists "te_update_own_draft_rejected" on public."time_entries";
create policy "te_update_own_draft_rejected" on public."time_entries" for update to authenticated using (((org_id = current_org_id()) AND (user_id = auth.uid()) AND (status = ANY (ARRAY['draft'::text, 'rejected'::text])))) with check (((org_id = current_org_id()) AND (user_id = auth.uid()) AND (status = ANY (ARRAY['draft'::text, 'rejected'::text, 'submitted'::text])) AND (EXISTS ( SELECT 1
   FROM project_members pm
  WHERE ((pm.org_id = time_entries.org_id) AND (pm.project_id = time_entries.project_id) AND (pm.user_id = auth.uid()))))));
drop policy if exists "audit_log_insert_own" on public.audit_log;
create policy "audit_log_insert_own" on public.audit_log
for insert to authenticated
with check (org_id = current_org_id() and actor_id = auth.uid());
drop policy if exists "audit_log_select_admin_manager" on public.audit_log;
create policy "audit_log_select_admin_manager" on public.audit_log
for select to authenticated
using (org_id = current_org_id() and current_role() in ('admin','manager'));
commit;
