-- Enable HTTP extension to make API calls from Database
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- Create a secure function to send emails via Resend API
create or replace function public.send_beta_email(
  email text,
  invite_code text,
  recipient_name text default '',
  app_url text default 'https://dermdesk.net'
)
returns json
language plpgsql
security definer
as $$
declare
  resend_api_key text := 're_RXQhVLDW_AV7fZCyGBGosbf26fTK64d6y'; -- USER MUST REPLACE THIS
  response_status integer;
  response_content text;
  email_html text;
begin
  -- Check if caller is super_admin
  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'super_admin') then
     raise exception 'Permission denied';
  end if;

  -- Prepare HTML Content
  email_html := '<div style="font-family: sans-serif; padding: 20px;">' ||
                '<h1>🎉 Beta Davetiniz Hazır!</h1>' ||
                '<p>Merhaba ' || recipient_name || ',</p>' ||
                '<p>Dermdesk Beta programına kaydınız onaylandı.</p>' ||
                '<div style="background: #f0fdfa; padding: 15px; border-left: 4px solid #0d9488; margin: 20px 0;">' ||
                '<p style="margin:0; font-size: 12px; color: #666;">Davet Kodunuz:</p>' ||
                '<p style="margin:5px 0 0 0; font-size: 24px; font-weight: bold; color: #0f766e; letter-spacing: 2px;">' || invite_code || '</p>' ||
                '</div>' ||
                '<p><a href="' || app_url || '/signup?code=' || invite_code || '" style="background: #0d9488; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Hesap Oluştur</a></p>' ||
                '</div>';

  -- Make HTTP Request to Resend
  select 
    status,
    content::text
  into
    response_status,
    response_content
  from
    extensions.http((
      'POST',
      'https://api.resend.com/emails',
      ARRAY[http_header('Authorization', 'Bearer ' || resend_api_key), http_header('Content-Type', 'application/json')],
      'application/json',
      json_build_object(
        'from', 'Dermdesk <noreply@dermdesk.net>', -- Using verified domain
        'to', ARRAY[email],
        'subject', '🎉 Beta Davetiniz: ' || invite_code,
        'html', email_html
      )::text
    ));

  if response_status > 299 then
    raise exception 'Resend API Error: %', response_content;
  end if;

  return json_build_object('success', true, 'id', response_content);
end;
$$;
