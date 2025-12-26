import { validateAdminRequest } from '@/lib/auth-utils';
import { createAdminClient } from '@/lib/supabase/admin';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/admin/client/[id]/notes
 * Get all notes for a client
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get all notes for this client
    const { data: notes, error } = await supabase
      .from('client_notes')
      .select(`
        id,
        type,
        content,
        createdAt,
        createdById,
        admin_profiles:createdById (
          first_name,
          last_name
        )
      `)
      .eq('clientId', clientId)
      .order('createdAt', { ascending: false });

    if (error) {
      console.error('Error fetching notes:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch notes' },
        { status: 500 }
      );
    }

    // Format notes for frontend
    const formattedNotes = (notes || []).map((note: any) => ({
      id: note.id,
      type: note.type || 'General',
      content: note.content,
      timestamp: new Date(note.createdAt).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }) + ' UTC',
      createdAt: note.createdAt,
      createdBy: note.admin_profiles ? `${note.admin_profiles.first_name} ${note.admin_profiles.last_name}` : 'System',
    }));

    return NextResponse.json({
      success: true,
      notes: formattedNotes,
      count: formattedNotes.length,
    });
  } catch (error: any) {
    console.error('[Client Notes API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/client/[id]/notes
 * Add a new note to a client
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;
    const body = await request.json();

    if (!clientId) {
      return NextResponse.json(
        { success: false, error: 'Client ID is required' },
        { status: 400 }
      );
    }

    const { type, content } = body;

    if (!content || content.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Note content is required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('client_profiles')
      .select('id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { success: false, error: 'Client not found' },
        { status: 404 }
      );
    }

    // Insert the note
    const { data: note, error: noteError } = await supabase
      .from('client_notes')
      .insert({
        clientId,
        type: type || 'General',
        content: content.trim(),
        createdById: auth.admin.id,
        createdAt: new Date().toISOString(),
      })
      .select(`
        id,
        type,
        content,
        createdAt
      `)
      .single();

    if (noteError) {
      console.error('Error creating note:', noteError);
      return NextResponse.json(
        { success: false, error: 'Failed to create note' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('audit_log').insert({
      adminId: auth.admin.id,
      action: 'note_added',
      entityType: 'client',
      entityId: clientId,
      newValues: {
        noteId: note.id,
        type: note.type,
        content: content.substring(0, 100), // Truncate for audit log
      },
      createdAt: new Date().toISOString(),
    });

    // Get admin info for response
    const { data: admin } = await supabase
      .from('admin_profiles')
      .select('first_name, last_name')
      .eq('id', auth.admin.id)
      .single();

    return NextResponse.json({
      success: true,
      note: {
        id: note.id,
        type: note.type,
        content: note.content,
        timestamp: new Date(note.createdAt).toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: false,
        }) + ' UTC',
        createdAt: note.createdAt,
        createdBy: admin ? `${admin.first_name} ${admin.last_name}` : 'Admin',
      },
    });
  } catch (error: any) {
    console.error('[Client Notes API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/client/[id]/notes
 * Delete a note (requires noteId in body)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await validateAdminRequest(request);
    if (!auth.isValid) {
      return auth.errorResponse!;
    }

    const { id: clientId } = await params;
    const { noteId } = await request.json();

    if (!clientId || !noteId) {
      return NextResponse.json(
        { success: false, error: 'Client ID and note ID are required' },
        { status: 400 }
      );
    }

    const supabase = createAdminClient();

    // Get note before deletion for audit log
    const { data: note, error: fetchError } = await supabase
      .from('client_notes')
      .select('*')
      .eq('id', noteId)
      .eq('clientId', clientId)
      .single();

    if (fetchError || !note) {
      return NextResponse.json(
        { success: false, error: 'Note not found' },
        { status: 404 }
      );
    }

    // Delete the note
    const { error: deleteError } = await supabase
      .from('client_notes')
      .delete()
      .eq('id', noteId)
      .eq('clientId', clientId);

    if (deleteError) {
      console.error('Error deleting note:', deleteError);
      return NextResponse.json(
        { success: false, error: 'Failed to delete note' },
        { status: 500 }
      );
    }

    // Log activity
    await supabase.from('audit_log').insert({
      adminId: auth.admin.id,
      action: 'note_deleted',
      entityType: 'client',
      entityId: clientId,
      oldValues: {
        noteId,
        type: note.type,
        content: note.content?.substring(0, 100),
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error: any) {
    console.error('[Client Notes API] Error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
