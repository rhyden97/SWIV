import { NextResponse } from "next/server";

export function apiError(error, label) {
  if (label) console.error(label, error);
  return NextResponse.json(
    { error: error.message },
    { status: 500 },
  );
}

export function badRequest(message) {
  return NextResponse.json({ error: message }, { status: 400 });
}
