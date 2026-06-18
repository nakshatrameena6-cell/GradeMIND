import { NextResponse } from 'next/server';
import * as fs from 'fs';
import * as path from 'path';

export async function GET() {
  const src = 'd:\\GM\\GM';
  const dest = 'd:\\GradeMIND\\frontend';
  const backup = 'd:\\GradeMIND\\frontend_backup';

  try {
    // 1. Delete backup if it exists
    if (fs.existsSync(backup)) {
      fs.rmSync(backup, { recursive: true, force: true });
    }

    // 2. Rename dest to backup if dest exists
    if (fs.existsSync(dest)) {
      fs.renameSync(dest, backup);
    }

    // 3. Recreate dest
    fs.mkdirSync(dest, { recursive: true });

    // 4. Recursive copy function
    function copyFolderSync(from: string, to: string) {
      fs.mkdirSync(to, { recursive: true });
      fs.readdirSync(from).forEach(element => {
        if (element === 'node_modules' || element === '.next') {
          return;
        }
        const fromPath = path.join(from, element);
        const toPath = path.join(to, element);
        if (fs.lstatSync(fromPath).isDirectory()) {
          copyFolderSync(fromPath, toPath);
        } else {
          fs.copyFileSync(fromPath, toPath);
        }
      });
    }

    copyFolderSync(src, dest);

    return NextResponse.json({
      success: true,
      message: `Successfully renamed old frontend to ${backup} and copied ${src} to ${dest}.`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
    });
  }
}
